import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@acme/db";

const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET;

// Early validation
if (!N8N_CALLBACK_SECRET) {
  console.error("[N8N Callback] N8N_CALLBACK_SECRET environment variable is not set");
}

// Input schema
const CallbackSchema = z.object({
  secret: z.string(),
  taskId: z.number(),
  status: z.enum(["COMPLETED", "FAILED", "PROCESSING"]),
  result: z.any().optional(),
  discoveredUrls: z.array(z.string()).optional(), // 来自工作流 1
  errorMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[N8N Callback] Received callback");

    const body = await request.json();
    console.log("[N8N Callback] Request body:", JSON.stringify(body, null, 2));

    // Validate input
    const validatedInput = CallbackSchema.parse(body);
    console.log("[N8N Callback] Input validated successfully");

    // Verify secret
    if (!N8N_CALLBACK_SECRET) {
      console.error("[N8N Callback] N8N_CALLBACK_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (validatedInput.secret !== N8N_CALLBACK_SECRET) {
      console.error("[N8N Callback] Invalid secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update database
    const updateData: any = {
      status: validatedInput.status,
      updatedAt: new Date(),
    };

    if (validatedInput.result) {
      updateData.result = JSON.stringify(validatedInput.result);
    }

    if (validatedInput.discoveredUrls) {
      updateData.discoveredUrls = JSON.stringify(validatedInput.discoveredUrls);
    }

    if (validatedInput.errorMessage) {
      updateData.errorMessage = validatedInput.errorMessage;
    }

    if (validatedInput.status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    await db
      .updateTable("AsyncAnalysisTask")
      .set(updateData)
      .where("id", "=", validatedInput.taskId)
      .execute();

    console.log("[N8N Callback] Task updated successfully:", validatedInput.taskId);

    // Check if all tasks for this project are complete
    const task = await db
      .selectFrom("AsyncAnalysisTask")
      .select(["projectId", "authUserId"])
      .where("id", "=", validatedInput.taskId)
      .executeTakeFirst();

    if (task) {
      const allTasks = await db
        .selectFrom("AsyncAnalysisTask")
        .selectAll()
        .where("projectId", "=", task.projectId)
        .where("authUserId", "=", task.authUserId)
        .execute();

      const total = allTasks.length;
      const completed = allTasks.filter(t => t.status === "COMPLETED").length;
      const failed = allTasks.filter(t => t.status === "FAILED").length;

      console.log(`[N8N Callback] Project ${task.projectId} progress: ${completed}/${total} completed, ${failed} failed`);

      // TODO: 如果全部完成，可以发送通知/WebSocket 等
      if (completed + failed === total) {
        console.log(`[N8N Callback] Project ${task.projectId} analysis completed!`);
      }
    }

    return NextResponse.json({
      success: true,
      taskId: validatedInput.taskId,
      status: validatedInput.status,
    });

  } catch (error) {
    console.error("[N8N Callback] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid callback data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process callback",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
