import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@saasfly/db";

const N8N_FEATURE_MATRIX_URL_1 = process.env.N8N_FEATURE_MATRIX_URL_1;
const N8N_FEATURE_MATRIX_URL_2 = process.env.N8N_FEATURE_MATRIX_URL_2;

// Early validation of required environment variables
if (!N8N_FEATURE_MATRIX_URL_1) {
  console.error("[Matrix Forge Trigger] N8N_FEATURE_MATRIX_URL_1 environment variable is not set");
}
if (!N8N_FEATURE_MATRIX_URL_2) {
  console.error("[Matrix Forge Trigger] N8N_FEATURE_MATRIX_URL_2 environment variable is not set");
}

// Input schema
const InputSchema = z.object({
  projectId: z.number(),
  topFiveCompetitors: z.array(
    z.object({
      name: z.string(),
      website: z.string(),
      tagline: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[Matrix Forge Trigger] Received request");

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check required environment variables
    if (!N8N_FEATURE_MATRIX_URL_1 || !N8N_FEATURE_MATRIX_URL_2) {
      console.error("[Matrix Forge Trigger] Missing environment variables");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "N8N feature matrix webhook URLs are not configured"
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("[Matrix Forge Trigger] Request body:", JSON.stringify(body, null, 2));

    // Validate input
    const validatedInput = InputSchema.parse(body);
    console.log("[Matrix Forge Trigger] Input validated successfully");

    // Step 1: 为每个竞品创建数据库记录
    const taskIds: number[] = [];

    for (const competitor of validatedInput.topFiveCompetitors) {
      const result = await db
        .insertInto("AsyncAnalysisTask")
        .values({
          projectId: validatedInput.projectId,
          authUserId: userId,
          workflowType: "FEATURE_MATRIX",
          status: "PENDING",
          inputData: JSON.stringify({
            name: competitor.name,
            website: competitor.website,
            tagline: competitor.tagline || "",
          }),
        })
        .returning("id")
        .executeTakeFirst();

      if (result?.id) {
        taskIds.push(result.id);
      }
    }

    console.log("[Matrix Forge Trigger] Created tasks:", taskIds);

    // Step 2: 并行处理每个竞品 (方案A: 流式处理)
    // 不等待结果,立即返回 taskIds
    processCompetitorsInParallel(
      validatedInput.topFiveCompetitors,
      validatedInput.projectId,
      userId,
      taskIds
    ).catch((error) => {
      console.error("[Matrix Forge Trigger] Background processing error:", error);
    });

    return NextResponse.json({
      success: true,
      taskIds,
      message: `Started analysis for ${taskIds.length} competitors`,
    });

  } catch (error) {
    console.error("[Matrix Forge Trigger] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to trigger analysis",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * 方案A: 流式处理 - 并行处理每个竞品
 * 每个竞品独立处理: feature-matrix-1 → feature-matrix-2
 */
async function processCompetitorsInParallel(
  competitors: Array<{ name: string; website: string; tagline?: string }>,
  projectId: number,
  userId: string,
  taskIds: number[]
) {
  console.log("[Matrix Forge] Starting parallel processing for", competitors.length, "competitors");

  // 使用 Promise.allSettled 确保单个竞品失败不影响其他竞品
  const results = await Promise.allSettled(
    competitors.map((competitor, index) => {
      const taskId = taskIds[index];
      if (!taskId) {
        throw new Error(`Missing taskId for competitor ${competitor.name}`);
      }
      return processSingleCompetitor(competitor, projectId, taskId);
    })
  );

  // 统计结果
  const succeeded = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  console.log(`[Matrix Forge] Completed: ${succeeded} succeeded, ${failed} failed`);
}

/**
 * 处理单个竞品: Matrix-1 → Matrix-2 → 回调前端
 */
async function processSingleCompetitor(
  competitor: { name: string; website: string; tagline?: string },
  projectId: number,
  taskId: number
) {
  const competitorName = competitor.name;
  console.log(`[Matrix Forge] Processing competitor: ${competitorName} (taskId: ${taskId})`);

  try {
    // 更新状态为处理中
    await db
      .updateTable("AsyncAnalysisTask")
      .set({
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where("id", "=", taskId)
      .execute();

    // Step 1: 调用 feature-matrix-1 (单个竞品)
    console.log(`[Matrix Forge] [${competitorName}] Calling feature-matrix-1`);

    const matrix1Response = await fetch(N8N_FEATURE_MATRIX_URL_1!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        topFiveCompetitors: [competitor], // 单个竞品
      }),
      signal: AbortSignal.timeout(180000), // 3分钟超时
    });

    if (!matrix1Response.ok) {
      throw new Error(`Matrix-1 failed: ${await matrix1Response.text()}`);
    }

    const matrix1Data = await matrix1Response.json();
    console.log(`[Matrix Forge] [${competitorName}] Matrix-1 completed:`, matrix1Data);

    // Step 2: 立即调用 feature-matrix-2
    console.log(`[Matrix Forge] [${competitorName}] Calling feature-matrix-2`);

    const matrix2Response = await fetch(N8N_FEATURE_MATRIX_URL_2!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        taskId,
        competitorName,
        matrix1Result: matrix1Data,
      }),
      signal: AbortSignal.timeout(180000), // 3分钟超时
    });

    if (!matrix2Response.ok) {
      throw new Error(`Matrix-2 failed: ${await matrix2Response.text()}`);
    }

    const matrix2Data = await matrix2Response.json();
    console.log(`[Matrix Forge] [${competitorName}] Matrix-2 completed:`, matrix2Data);

    // Step 3: 更新数据库状态为完成
    await db
      .updateTable("AsyncAnalysisTask")
      .set({
        status: "COMPLETED",
        outputData: JSON.stringify(matrix2Data),
        updatedAt: new Date(),
      })
      .where("id", "=", taskId)
      .execute();

    console.log(`[Matrix Forge] [${competitorName}] ✅ Completed successfully`);

  } catch (error) {
    console.error(`[Matrix Forge] [${competitorName}] ❌ Failed:`, error);

    // 更新数据库状态为失败
    await db
      .updateTable("AsyncAnalysisTask")
      .set({
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      })
      .where("id", "=", taskId)
      .execute();

    throw error; // 重新抛出错误供 Promise.allSettled 捕获
  }
}
