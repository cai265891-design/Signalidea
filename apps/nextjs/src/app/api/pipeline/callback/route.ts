import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@saasfly/db";

const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET || "default-secret-change-me";
const N8N_COMPETITOR_DISCOVERY_URL = process.env.N8N_COMPETITOR_DISCOVERY_URL;
const N8N_TOP_FIVE_SELECTOR_URL = process.env.N8N_TOP_FIVE_SELECTOR_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Callback input schema
const CallbackSchema = z.object({
  secret: z.string(),
  taskId: z.number(),
  status: z.enum(["COMPLETED", "FAILED"]),
  result: z.any().optional(),
  errorMessage: z.string().optional(),
});

/**
 * POST /api/pipeline/callback
 *
 * N8N 工作流完成后的回调接口:
 * 1. 验证密钥
 * 2. 更新 AsyncAnalysisTask 状态
 * 3. 更新 PipelineJob 缓存
 * 4. 根据工作流类型触发下一个阶段
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Pipeline Callback] Received callback");

    const body = await request.json();
    const { secret, taskId, status, result, errorMessage } = CallbackSchema.parse(body);

    // Verify secret
    if (secret !== N8N_CALLBACK_SECRET) {
      console.error("[Pipeline Callback] Invalid secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Pipeline Callback] Task:", taskId, "Status:", status);

    // Get task info
    const task = await db
      .selectFrom("AsyncAnalysisTask")
      .selectAll()
      .where("id", "=", taskId)
      .executeTakeFirst();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update task status
    await db
      .updateTable("AsyncAnalysisTask")
      .set({
        status,
        result: result ? JSON.stringify(result) : undefined,
        errorMessage,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where("id", "=", taskId)
      .execute();

    console.log("[Pipeline Callback] Updated task:", taskId);

    // Get associated PipelineJob
    const pipelineJob = await db
      .selectFrom("PipelineJob")
      .selectAll()
      .where("id", "=", task.projectId) // projectId maps to PipelineJob.id
      .executeTakeFirst();

    if (!pipelineJob) {
      console.error("[Pipeline Callback] PipelineJob not found for projectId:", task.projectId);
      return NextResponse.json({ success: true }); // Task updated, but no pipeline to continue
    }

    // Handle based on workflow type and status
    if (status === "COMPLETED") {
      await handleCompletedTask(task, pipelineJob, result);
    } else if (status === "FAILED") {
      await handleFailedTask(task, pipelineJob, errorMessage);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Pipeline Callback] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid callback data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Callback processing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Handle completed task - cache result and trigger next stage
 */
async function handleCompletedTask(task: any, pipelineJob: any, result: any) {
  const workflowType = task.workflowType;

  console.log("[Pipeline Callback] Handling completed task:", workflowType);

  switch (workflowType) {
    case "INTENT_CLARIFIER":
      // Cache result
      await db
        .updateTable("PipelineJob")
        .set({
          intentResult: JSON.stringify(result),
          currentStage: "COMPETITOR_DISCOVERY",
          updatedAt: new Date(),
        })
        .where("id", "=", pipelineJob.id)
        .execute();

      // Trigger Competitor Discovery
      await triggerCompetitorDiscovery(pipelineJob, result);
      break;

    case "COMPETITOR_DISCOVERY":
      // Cache result
      await db
        .updateTable("PipelineJob")
        .set({
          competitorResult: JSON.stringify(result),
          currentStage: "TOP_FIVE_SELECTOR",
          updatedAt: new Date(),
        })
        .where("id", "=", pipelineJob.id)
        .execute();

      // Trigger Top-5 Selector (if more than 5 competitors)
      if (result.competitors && result.competitors.length > 5) {
        // Get intent result
        const intentResult = pipelineJob.intentResult
          ? (typeof pipelineJob.intentResult === "string"
              ? JSON.parse(pipelineJob.intentResult)
              : pipelineJob.intentResult)
          : null;

        await triggerTopFiveSelector(pipelineJob, result.competitors, intentResult);
      } else {
        // Mark as completed if ≤5 competitors
        await db
          .updateTable("PipelineJob")
          .set({
            topFiveResult: JSON.stringify(result), // Use all competitors as top-five
            status: "COMPLETED",
            currentStage: "COMPLETED",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where("id", "=", pipelineJob.id)
          .execute();
      }
      break;

    case "TOP_FIVE_SELECTOR":
      // Cache result and mark pipeline as completed
      await db
        .updateTable("PipelineJob")
        .set({
          topFiveResult: JSON.stringify(result),
          status: "COMPLETED",
          currentStage: "COMPLETED",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where("id", "=", pipelineJob.id)
        .execute();
      break;

    default:
      console.warn("[Pipeline Callback] Unknown workflow type:", workflowType);
  }
}

/**
 * Handle failed task - mark pipeline as failed
 */
async function handleFailedTask(task: any, pipelineJob: any, errorMessage?: string) {
  console.error("[Pipeline Callback] Task failed:", task.id, errorMessage);

  await db
    .updateTable("PipelineJob")
    .set({
      status: "FAILED",
      errorMessage: errorMessage || `Task ${task.workflowType} failed`,
      updatedAt: new Date(),
    })
    .where("id", "=", pipelineJob.id)
    .execute();
}

/**
 * Trigger Competitor Discovery workflow
 */
async function triggerCompetitorDiscovery(pipelineJob: any, intentResult: any) {
  if (!N8N_COMPETITOR_DISCOVERY_URL) {
    console.error("[Pipeline Callback] N8N_COMPETITOR_DISCOVERY_URL not configured");
    return;
  }

  console.log("[Pipeline Callback] Triggering Competitor Discovery for job:", pipelineJob.id);

  // Create task
  const competitorTask = await db
    .insertInto("AsyncAnalysisTask")
    .values({
      projectId: pipelineJob.id,
      authUserId: pipelineJob.authUserId,
      workflowType: "COMPETITOR_DISCOVERY",
      status: "PROCESSING",
      inputData: JSON.stringify({
        userInput: pipelineJob.userInput,
        analysisData: intentResult,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(["id"])
    .executeTakeFirstOrThrow();

  // Update PipelineJob
  await db
    .updateTable("PipelineJob")
    .set({
      competitorTaskId: competitorTask.id,
      updatedAt: new Date(),
    })
    .where("id", "=", pipelineJob.id)
    .execute();

  // Call N8N
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (N8N_API_KEY) {
    headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
  }

  const payload = {
    userInput: pipelineJob.userInput,
    analysisData: intentResult,
    taskId: competitorTask.id,
  };

  await fetch(N8N_COMPETITOR_DISCOVERY_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  console.log("[Pipeline Callback] Triggered Competitor Discovery");
}

/**
 * Trigger Top-5 Selector workflow
 */
async function triggerTopFiveSelector(pipelineJob: any, competitors: any[], intentResult: any) {
  if (!N8N_TOP_FIVE_SELECTOR_URL) {
    console.error("[Pipeline Callback] N8N_TOP_FIVE_SELECTOR_URL not configured");
    return;
  }

  console.log("[Pipeline Callback] Triggering Top-5 Selector for job:", pipelineJob.id);

  // Create task
  const topFiveTask = await db
    .insertInto("AsyncAnalysisTask")
    .values({
      projectId: pipelineJob.id,
      authUserId: pipelineJob.authUserId,
      workflowType: "TOP_FIVE_SELECTOR",
      status: "PROCESSING",
      inputData: JSON.stringify({
        competitors,
        analysisData: intentResult,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning(["id"])
    .executeTakeFirstOrThrow();

  // Update PipelineJob
  await db
    .updateTable("PipelineJob")
    .set({
      topFiveTaskId: topFiveTask.id,
      updatedAt: new Date(),
    })
    .where("id", "=", pipelineJob.id)
    .execute();

  // Call N8N
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (N8N_API_KEY) {
    headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
  }

  const payload = {
    competitors,
    analysisData: intentResult,
    taskId: topFiveTask.id,
  };

  await fetch(N8N_TOP_FIVE_SELECTOR_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  console.log("[Pipeline Callback] Triggered Top-5 Selector");
}
