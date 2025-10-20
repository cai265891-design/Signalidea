import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@saasfly/db";
import type { PipelineJobStatus } from "~/types/pipeline";

/**
 * GET /api/pipeline/status/[jobId]
 *
 * 查询 Pipeline Job 的完整状态,包括:
 * - Pipeline Job 基本信息
 * - 各个子任务的状态
 * - 已完成任务的结果
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = parseInt(params.jobId, 10);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid jobId" },
        { status: 400 }
      );
    }

    console.log("[Pipeline Status] Querying job:", jobId);

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Query PipelineJob
    const pipelineJob = await db
      .selectFrom("PipelineJob")
      .selectAll()
      .where("id", "=", jobId)
      .where("authUserId", "=", userId)
      .executeTakeFirst();

    if (!pipelineJob) {
      return NextResponse.json(
        { error: "Pipeline job not found" },
        { status: 404 }
      );
    }

    // Query associated tasks
    const taskIds = [
      pipelineJob.intentTaskId,
      pipelineJob.competitorTaskId,
      pipelineJob.topFiveTaskId,
    ].filter((id): id is number => id !== null);

    let tasks: any[] = [];
    if (taskIds.length > 0) {
      tasks = await db
        .selectFrom("AsyncAnalysisTask")
        .selectAll()
        .where("id", "in", taskIds)
        .execute();
    }

    // Build task map
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Get individual tasks
    const intentTask = pipelineJob.intentTaskId
      ? taskMap.get(pipelineJob.intentTaskId)
      : null;
    const competitorTask = pipelineJob.competitorTaskId
      ? taskMap.get(pipelineJob.competitorTaskId)
      : null;
    const topFiveTask = pipelineJob.topFiveTaskId
      ? taskMap.get(pipelineJob.topFiveTaskId)
      : null;

    // Parse results
    const parseJsonField = (field: any) => {
      if (!field) return null;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch {
          return null;
        }
      }
      return field;
    };

    // Build response
    const response: PipelineJobStatus = {
      id: pipelineJob.id,
      authUserId: pipelineJob.authUserId,
      userInput: pipelineJob.userInput,
      status: pipelineJob.status,
      currentStage: pipelineJob.currentStage,
      errorMessage: pipelineJob.errorMessage,
      createdAt: pipelineJob.createdAt.toISOString(),
      updatedAt: pipelineJob.updatedAt.toISOString(),
      completedAt: pipelineJob.completedAt?.toISOString() || null,

      // Tasks
      intentTask: intentTask
        ? {
            id: intentTask.id,
            status: intentTask.status,
            workflowType: intentTask.workflowType,
            result: parseJsonField(intentTask.result),
            errorMessage: intentTask.errorMessage,
            createdAt: intentTask.createdAt.toISOString(),
            updatedAt: intentTask.updatedAt.toISOString(),
            completedAt: intentTask.completedAt?.toISOString() || null,
          }
        : null,

      competitorTask: competitorTask
        ? {
            id: competitorTask.id,
            status: competitorTask.status,
            workflowType: competitorTask.workflowType,
            result: parseJsonField(competitorTask.result),
            errorMessage: competitorTask.errorMessage,
            createdAt: competitorTask.createdAt.toISOString(),
            updatedAt: competitorTask.updatedAt.toISOString(),
            completedAt: competitorTask.completedAt?.toISOString() || null,
          }
        : null,

      topFiveTask: topFiveTask
        ? {
            id: topFiveTask.id,
            status: topFiveTask.status,
            workflowType: topFiveTask.workflowType,
            result: parseJsonField(topFiveTask.result),
            errorMessage: topFiveTask.errorMessage,
            createdAt: topFiveTask.createdAt.toISOString(),
            updatedAt: topFiveTask.updatedAt.toISOString(),
            completedAt: topFiveTask.completedAt?.toISOString() || null,
          }
        : null,

      // Cached results from PipelineJob
      intentResult: parseJsonField(pipelineJob.intentResult),
      competitorResult: parseJsonField(pipelineJob.competitorResult),
      topFiveResult: parseJsonField(pipelineJob.topFiveResult),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[Pipeline Status] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch pipeline status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
