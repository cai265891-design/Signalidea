import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const N8N_WEBHOOK_URL = process.env.N8N_COMPETITOR_DISCOVERY_URL || "http://localhost:5678/webhook/competitor-discovery";
const N8N_API_KEY = process.env.N8N_API_KEY;

// Input schema: data from Intent Clarifier
const InputSchema = z.object({
  userInput: z.string(),
  analysisData: z.object({
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
  }),
});

// n8n competitor discovery response schema
const N8NCompetitorSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  website: z.string(),
  lastUpdate: z.string(),
  confidence: z.number(),
});

const N8NResponseSchema = z.object({
  competitors: z.array(N8NCompetitorSchema),
  totalFound: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[N8N Competitor Discovery] Received request");
    const body = await request.json();
    console.log("[N8N Competitor Discovery] Request body:", body);

    // Validate input
    const validatedInput = InputSchema.parse(body);
    console.log("[N8N Competitor Discovery] Input validated successfully");

    // Prepare payload for n8n
    const payload = {
      userInput: validatedInput.userInput,
      requirementStatement: validatedInput.analysisData["Clear Requirement Statement"],
      mustHaves: validatedInput.analysisData.Certainties["Must-Haves"],
      keyAssumptions: validatedInput.analysisData["Key Assumptions"],
    };

    // Call n8n webhook
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (N8N_API_KEY) {
      headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
    }

    console.log("[N8N Competitor Discovery] Calling webhook:", N8N_WEBHOOK_URL);
    console.log("[N8N Competitor Discovery] Payload:", JSON.stringify(payload, null, 2));

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout (longer for competitor discovery)

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[N8N Competitor Discovery] Webhook error:", errorText);
        return NextResponse.json(
          {
            error: `n8n webhook failed: ${response.status} ${response.statusText}`,
            details: errorText
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("[N8N Competitor Discovery] N8N response:", data);

      // Validate response structure
      try {
        const validatedData = N8NResponseSchema.parse(data);
        console.log("[N8N Competitor Discovery] Validation successful, returning data");
        return NextResponse.json(validatedData);
      } catch (validationError) {
        console.error("[N8N Competitor Discovery] Validation error:", validationError);
        console.error("[N8N Competitor Discovery] Data that failed validation:", JSON.stringify(data, null, 2));
        return NextResponse.json(
          {
            error: "Invalid response format from N8N",
            details: validationError instanceof Error ? validationError.message : String(validationError)
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[N8N Competitor Discovery] Request timed out");
        return NextResponse.json(
          { error: "N8N webhook request timed out after 90 seconds" },
          { status: 504 }
        );
      }
      console.error("[N8N Competitor Discovery] Fetch error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("[N8N Competitor Discovery] Top-level error:", error);
    console.error("[N8N Competitor Discovery] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Check if it's a Zod validation error on input
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
        error: "Failed to discover competitors",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
