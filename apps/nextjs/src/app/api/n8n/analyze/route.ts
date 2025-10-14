import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    console.log("[N8N API] Received request");
    const body = await request.json();
    const { input } = body;
    console.log("[N8N API] Request body:", { input });

    if (!input || typeof input !== "string") {
      console.error("[N8N API] Invalid input:", { input, type: typeof input });
      return NextResponse.json(
        { error: "Input is required and must be a string" },
        { status: 400 }
      );
    }

    // 调用 n8n webhook
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication header if API key is configured
    if (N8N_API_KEY) {
      headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
    }

    console.log("Calling N8N webhook:", N8N_WEBHOOK_URL);
    console.log("Request payload:", { input });

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("n8n webhook error:", errorText);
        return NextResponse.json(
          { error: `n8n webhook failed: ${response.status} ${response.statusText}`, details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("[N8N API] N8N response:", data);

      // 验证返回数据结构
      try {
        const validatedData = N8NResponseSchema.parse(data);
        console.log("[N8N API] Validation successful, returning data");
        return NextResponse.json(validatedData);
      } catch (validationError) {
        console.error("[N8N API] Validation error:", validationError);
        console.error("[N8N API] Data that failed validation:", JSON.stringify(data, null, 2));
        return NextResponse.json(
          { error: "Invalid response format from N8N", details: validationError instanceof Error ? validationError.message : String(validationError) },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[N8N API] N8N request timed out");
        return NextResponse.json(
          { error: "N8N webhook request timed out after 60 seconds" },
          { status: 504 }
        );
      }
      console.error("[N8N API] Fetch error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("[N8N API] Top-level error in N8N analyze route:", error);
    console.error("[N8N API] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      {
        error: "Failed to analyze requirement",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
