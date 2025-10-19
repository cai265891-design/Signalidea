import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@saasfly/db";

// Query params schema
const QuerySchema = z.object({
  projectId: z.string().transform(Number),
});

export async function GET(request: NextRequest) {
  try {
    console.log("[Task Progress] Received request");

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    const validatedInput = QuerySchema.parse({ projectId });
    console.log("[Task Progress] Query for project:", validatedInput.projectId);

    // Query database
    const tasks = await db
      .selectFrom("AsyncAnalysisTask")
      .selectAll()
      .where("projectId", "=", validatedInput.projectId)
      .where("authUserId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    console.log("[Task Progress] Found", tasks.length, "tasks");

    // Calculate progress
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "COMPLETED").length;
    const failed = tasks.filter(t => t.status === "FAILED").length;
    const processing = tasks.filter(t => t.status === "PROCESSING").length;
    const pending = tasks.filter(t => t.status === "PENDING").length;

    // Transform tasks for frontend
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      status: task.status,
      inputData: typeof task.inputData === "string"
        ? JSON.parse(task.inputData)
        : task.inputData,
      result: task.result
        ? (typeof task.result === "string" ? JSON.parse(task.result) : task.result)
        : null,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    }));

    const response = {
      tasks: transformedTasks,
      progress: {
        total,
        completed,
        failed,
        processing,
        pending,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };

    console.log("[Task Progress] Progress:", response.progress);

    return NextResponse.json(response);

  } catch (error) {
    console.error("[Task Progress] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch task progress",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
