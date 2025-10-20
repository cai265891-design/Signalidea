import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@saasfly/db";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Input validation
const InputSchema = z.object({
  userInput: z.string().min(1, "User input is required"),
});

/**
 * POST /api/pipeline/start
 *
 * 启动一个完整的 Pipeline 流程:
 * 1. 创建 PipelineJob 记录
 * 2. 创建 Intent Clarifier 任务
 * 3. 触发 N8N 工作流 (不等待结果)
 * 4. 立即返回 jobId
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Pipeline Start] Received request");

    // 1. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const { userInput } = InputSchema.parse(body);
    console.log("[Pipeline Start] User input:", userInput.substring(0, 100));

    // 3. Check N8N configuration
    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: "N8N webhook URL not configured" },
        { status: 500 }
      );
    }

    // 4. Create PipelineJob record
    const pipelineJob = await db
      .insertInto("PipelineJob")
      .values({
        authUserId: userId,
        userInput: userInput,
        status: "PENDING",
        currentStage: "INTENT_CLARIFIER",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning(["id", "status", "createdAt"])
      .executeTakeFirstOrThrow();

    console.log("[Pipeline Start] Created PipelineJob:", pipelineJob.id);

    // 5. Create AsyncAnalysisTask for Intent Clarifier
    const intentTask = await db
      .insertInto("AsyncAnalysisTask")
      .values({
        projectId: pipelineJob.id, // Use pipelineJob.id as projectId
        authUserId: userId,
        workflowType: "INTENT_CLARIFIER",
        status: "PENDING",
        inputData: JSON.stringify({ input: userInput }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    console.log("[Pipeline Start] Created Intent Clarifier task:", intentTask.id);

    // 6. Update PipelineJob with intentTaskId
    await db
      .updateTable("PipelineJob")
      .set({
        intentTaskId: intentTask.id,
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where("id", "=", pipelineJob.id)
      .execute();

    // 7. Trigger N8N webhook asynchronously (fire-and-forget)
    triggerN8NAnalysis(intentTask.id, userInput).catch((error) => {
      console.error("[Pipeline Start] Failed to trigger N8N:", error);
      // Update task status to FAILED
      db.updateTable("AsyncAnalysisTask")
        .set({
          status: "FAILED",
          errorMessage: `Failed to trigger N8N: ${error.message}`,
          updatedAt: new Date(),
        })
        .where("id", "=", intentTask.id)
        .execute()
        .catch(console.error);
    });

    // 8. Return jobId immediately
    return NextResponse.json({
      jobId: pipelineJob.id,
      status: "PROCESSING",
      message: "Pipeline started successfully. Use /api/pipeline/status/{jobId} to check progress.",
    });

  } catch (error) {
    console.error("[Pipeline Start] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to start pipeline",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Trigger N8N Analysis workflow (async, no await)
 */
async function triggerN8NAnalysis(taskId: number, userInput: string): Promise<void> {
  console.log("[Pipeline Start] Triggering N8N for task:", taskId);

  // Update task status to PROCESSING
  await db
    .updateTable("AsyncAnalysisTask")
    .set({
      status: "PROCESSING",
      updatedAt: new Date(),
    })
    .where("id", "=", taskId)
    .execute();

  // Call N8N webhook
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (N8N_API_KEY) {
    headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
  }

  const response = await fetch(N8N_WEBHOOK_URL!, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: userInput,
      taskId, // Pass taskId so N8N can callback
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
  }

  console.log("[Pipeline Start] N8N webhook triggered successfully for task:", taskId);
}
