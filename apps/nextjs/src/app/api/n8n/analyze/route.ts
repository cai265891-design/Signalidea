import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Early validation
if (!N8N_WEBHOOK_URL) {
  console.error("[N8N API] N8N_WEBHOOK_URL environment variable is not set");
}

// n8n 返回数据的类型定义 - includes all fields from Intent Clarifier
const N8NResponseSchema = z.object({
  "Clear Requirement Statement": z.string(),
  "Certainties": z.object({
    "Target User Profile": z.string().optional(),
    "Target Market": z.string().optional(),
    "Must-Haves": z.array(z.string()).optional(),
    "Success Criteria": z.array(z.string()).optional(),
    "Out of Scope": z.array(z.string()).optional(),
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

    // Check environment variable
    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "N8N_WEBHOOK_URL environment variable is not configured"
        },
        { status: 500 }
      );
    }

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
      // N8N webhook uses Authorization: Bearer <token>
      headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
    }

    console.log("Calling N8N webhook:", N8N_WEBHOOK_URL);
    console.log("Using API Key auth:", !!N8N_API_KEY);
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

        // Check for authentication errors
        if (errorText.includes("Authorization data is wrong") || errorText.includes("Unauthorized")) {
          return NextResponse.json(
            {
              error: "N8N authentication failed",
              details: "N8N_API_KEY is missing or incorrect. Please check N8N settings."
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: `n8n webhook failed: ${response.status} ${response.statusText}`, details: errorText },
          { status: response.status }
        );
      }

      const responseText = await response.text();
      console.log("[N8N API] Raw response:", responseText);

      // Check for authentication errors in 200 responses
      if (responseText.includes("Authorization data is wrong") || responseText.includes("Unauthorized")) {
        return NextResponse.json(
          {
            error: "N8N authentication failed",
            details: "N8N_API_KEY is missing or incorrect. Please check N8N settings."
          },
          { status: 401 }
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[N8N API] Failed to parse response:", parseError);
        return NextResponse.json(
          { error: "Invalid JSON response from N8N", details: responseText.substring(0, 500) },
          { status: 500 }
        );
      }
      console.log("[N8N API] N8N response:", data);

      // N8N returns an array, extract the first element
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
        console.log("[N8N API] Extracted first element from array");
      }

      // 验证返回数据结构
      try {
        const validatedData = N8NResponseSchema.parse(data);
        console.log("[N8N API] Validation successful, returning data");

        // Ensure Must-Haves exists (add empty array if missing)
        const responseData = {
          ...validatedData,
          "Certainties": {
            ...validatedData["Certainties"],
            "Must-Haves": validatedData["Certainties"]["Must-Haves"] || [],
          },
        };

        return NextResponse.json(responseData);
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
