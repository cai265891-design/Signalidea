import { z } from "zod";

import { createTRPCRouter, procedure, protectedProcedure, publicProcedure } from "../trpc";

// N8N configuration from environment variables
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/requirement-analysis";
const N8N_WEBHOOK_DISCOVER_URL = process.env.N8N_WEBHOOK_DISCOVER_URL;
const N8N_WEBHOOK_SCRAPE_URL = process.env.N8N_WEBHOOK_SCRAPE_URL;
const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET;
const N8N_API_KEY = process.env.N8N_API_KEY;

// n8n 返回数据的类型定义
const N8NResponseSchema = z.object({
  "Clear Requirement Statement": z.string(),
  Certainties: z.object({
    "Must-Haves": z.array(z.string()),
  }),
  "Key Assumptions": z.array(
    z.object({
      assumption: z.string(),
      rationale: z.string(),
      confidence: z.number(),
    }),
  ),
});

// 并发触发函数
async function triggerParallelScraping(ctx: any, taskIds: number[]) {
  const tasks = await ctx.db
    .selectFrom("AsyncAnalysisTask")
    .selectAll()
    .where("id", "in", taskIds)
    .execute();

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
      });
    })
  );
}

export const n8nRouter = createTRPCRouter({
  // 原有的需求分析接口
  analyzeRequirement: procedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { input } = opts.input;

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (N8N_API_KEY) {
          headers["Authorization"] = N8N_API_KEY;
        }

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ input }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("n8n webhook error:", errorText);
          throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const validatedData = N8NResponseSchema.parse(data);

        return validatedData;
      } catch (error) {
        console.error("Error calling n8n webhook:", error);
        throw new Error(
          `Failed to analyze requirement: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),

  // 新增：触发工作流 1 - URL 发现
  triggerDiscovery: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        topFiveCompetitors: z.array(
          z.object({
            name: z.string(),
            website: z.string(),
            tagline: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!N8N_WEBHOOK_DISCOVER_URL) {
        throw new Error("N8N_WEBHOOK_DISCOVER_URL is not configured");
      }

      const authUserId = ctx.session.user.id;

      // 调用 N8N 工作流 1
      const response = await fetch(N8N_WEBHOOK_DISCOVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: input.projectId,
          authUserId,
          topFiveCompetitors: input.topFiveCompetitors,
        }),
      });

      if (!response.ok) {
        throw new Error(`N8N workflow failed: ${response.status}`);
      }

      const { taskIds } = await response.json();

      // 并发触发工作流 2
      await triggerParallelScraping(ctx, taskIds);

      return { success: true, taskIds };
    }),

  // 新增：处理 N8N 回调
  handleCallback: publicProcedure
    .input(
      z.object({
        secret: z.string(),
        taskId: z.number(),
        status: z.enum(["COMPLETED", "FAILED"]),
        result: z.any().optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 验证密钥
      if (input.secret !== N8N_CALLBACK_SECRET) {
        throw new Error("Unauthorized");
      }

      // 更新数据库
      await ctx.db
        .updateTable("AsyncAnalysisTask")
        .set({
          status: input.status,
          result: input.result ? JSON.stringify(input.result) : undefined,
          errorMessage: input.errorMessage,
          completedAt: input.status === "COMPLETED" ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where("id", "=", input.taskId)
        .execute();

      return { success: true };
    }),

  // 新增：查询任务进度
  getTaskProgress: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db
        .selectFrom("AsyncAnalysisTask")
        .selectAll()
        .where("projectId", "=", input.projectId)
        .where("authUserId", "=", ctx.session.user.id)
        .orderBy("createdAt", "desc")
        .execute();

      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "COMPLETED").length;
      const failed = tasks.filter((t) => t.status === "FAILED").length;
      const processing = tasks.filter((t) => t.status === "PROCESSING").length;

      return {
        tasks,
        progress: {
          total,
          completed,
          failed,
          processing,
          pending: total - completed - failed - processing,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    }),

  // 新增：重试失败的任务
  retryTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db
        .selectFrom("AsyncAnalysisTask")
        .selectAll()
        .where("id", "=", input.taskId)
        .where("authUserId", "=", ctx.session.user.id)
        .executeTakeFirst();

      if (!task) {
        throw new Error("Task not found");
      }

      if (task.status !== "FAILED") {
        throw new Error("Can only retry failed tasks");
      }

      // 重置状态
      await ctx.db
        .updateTable("AsyncAnalysisTask")
        .set({
          status: "PENDING",
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where("id", "=", input.taskId)
        .execute();

      // 重新触发工作流 2
      await triggerParallelScraping(ctx, [task.id]);

      return { success: true };
    }),
});
