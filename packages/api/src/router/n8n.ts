import { z } from "zod";

import { createTRPCRouter, procedure } from "../trpc";

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

export const n8nRouter = createTRPCRouter({
  // TODO: Change to protectedProcedure when auth is enabled
  analyzeRequirement: procedure
    .input(
      z.object({
        input: z.string(),
      }),
    )
    .mutation(async (opts) => {
      const { input } = opts.input;

      try {
        // 调用 n8n webhook
        const response = await fetch(
          "http://localhost:5678/webhook/requirement-analysis",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ input }),
          },
        );

        if (!response.ok) {
          throw new Error(`n8n webhook failed: ${response.statusText}`);
        }

        const data = await response.json();

        // 验证返回数据结构
        const validatedData = N8NResponseSchema.parse(data);

        return validatedData;
      } catch (error) {
        console.error("Error calling n8n webhook:", error);
        throw new Error(
          `Failed to analyze requirement: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),
});
