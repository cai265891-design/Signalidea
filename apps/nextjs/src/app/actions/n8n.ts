"use server";

import { z } from "zod";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/requirement-analysis";
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

export type N8NAnalysisResult = z.infer<typeof N8NResponseSchema>;

export async function analyzeRequirement(input: string): Promise<N8NAnalysisResult> {
  try {
    // 调用 n8n webhook
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication header if API key is configured
    if (N8N_API_KEY) {
      headers["Authorization"] = N8N_API_KEY;
    }

    console.log("Calling N8N webhook:", N8N_WEBHOOK_URL);
    console.log("Request payload:", { input });

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
    console.log("N8N response:", data);

    // 验证返回数据结构
    const validatedData = N8NResponseSchema.parse(data);

    return validatedData;
  } catch (error) {
    console.error("Error calling n8n webhook:", error);
    throw new Error(
      `Failed to analyze requirement: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
