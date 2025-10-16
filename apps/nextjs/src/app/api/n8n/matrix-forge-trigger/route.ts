import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@acme/db";

const N8N_WEBHOOK_DISCOVER_URL = process.env.N8N_WEBHOOK_DISCOVER_URL;
const N8N_WEBHOOK_SCRAPE_URL = process.env.N8N_WEBHOOK_SCRAPE_URL;

// Early validation of required environment variables
if (!N8N_WEBHOOK_DISCOVER_URL) {
  console.error("[Matrix Forge Trigger] N8N_WEBHOOK_DISCOVER_URL environment variable is not set");
}
if (!N8N_WEBHOOK_SCRAPE_URL) {
  console.error("[Matrix Forge Trigger] N8N_WEBHOOK_SCRAPE_URL environment variable is not set");
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
    if (!N8N_WEBHOOK_DISCOVER_URL || !N8N_WEBHOOK_SCRAPE_URL) {
      console.error("[Matrix Forge Trigger] Missing environment variables");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "N8N webhook URLs are not configured"
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

    // Step 2: 调用工作流 1 - URL 发现
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

    try {
      const discoverResponse = await fetch(N8N_WEBHOOK_DISCOVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: validatedInput.projectId,
          authUserId: userId,
          topFiveCompetitors: validatedInput.topFiveCompetitors,
          taskIds, // 传递数据库任务 IDs
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!discoverResponse.ok) {
        const errorText = await discoverResponse.text();
        console.error("[Matrix Forge Trigger] Discover workflow error:", errorText);

        // 标记所有任务为失败
        await db
          .updateTable("AsyncAnalysisTask")
          .set({
            status: "FAILED",
            errorMessage: `Discover workflow failed: ${errorText}`,
            updatedAt: new Date(),
          })
          .where("id", "in", taskIds)
          .execute();

        return NextResponse.json(
          {
            error: "N8N discover workflow failed",
            details: errorText
          },
          { status: discoverResponse.status }
        );
      }

      const discoverData = await discoverResponse.json();
      console.log("[Matrix Forge Trigger] Discover workflow completed:", discoverData);

      // Step 3: 并发触发工作流 2 - 内容爬取
      await triggerParallelScraping(taskIds);

      return NextResponse.json({
        success: true,
        taskIds,
        message: `Started analysis for ${taskIds.length} competitors`,
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[Matrix Forge Trigger] Request timed out");

        // 标记任务为失败
        await db
          .updateTable("AsyncAnalysisTask")
          .set({
            status: "FAILED",
            errorMessage: "Workflow timed out after 2 minutes",
            updatedAt: new Date(),
          })
          .where("id", "in", taskIds)
          .execute();

        return NextResponse.json(
          { error: "N8N workflow timed out after 2 minutes" },
          { status: 504 }
        );
      }

      throw fetchError;
    }

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

// 并发触发函数
async function triggerParallelScraping(taskIds: number[]) {
  const tasks = await db
    .selectFrom("AsyncAnalysisTask")
    .selectAll()
    .where("id", "in", taskIds)
    .execute();

  console.log("[Matrix Forge Trigger] Triggering parallel scraping for", tasks.length, "tasks");

  await Promise.all(
    tasks.map(async (task) => {
      const inputData = typeof task.inputData === "string"
        ? JSON.parse(task.inputData)
        : task.inputData;
      const urls = task.discoveredUrls
        ? (typeof task.discoveredUrls === "string"
            ? JSON.parse(task.discoveredUrls)
            : task.discoveredUrls)
        : [];

      console.log(`[Matrix Forge Trigger] Triggering scrape for task ${task.id}:`, inputData.name);

      return fetch(N8N_WEBHOOK_SCRAPE_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          projectId: task.projectId,
          competitorName: inputData.name,
          website: inputData.website,
          urls,
        }),
      }).catch(err => {
        console.error(`[Matrix Forge Trigger] Failed to trigger scrape for task ${task.id}:`, err);
        // 不抛出错误，让其他任务继续执行
      });
    })
  );

  console.log("[Matrix Forge Trigger] All parallel scraping tasks triggered");
}
