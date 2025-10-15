import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const N8N_WEBHOOK_URL = process.env.N8N_COMPETITOR_DISCOVERY_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Early validation of required environment variables
if (!N8N_WEBHOOK_URL) {
  console.error("[N8N Competitor Discovery] N8N_COMPETITOR_DISCOVERY_URL environment variable is not set");
}
if (!N8N_API_KEY) {
  console.warn("[N8N Competitor Discovery] N8N_API_KEY environment variable is not set - requests may fail");
}

// Input schema: data from Intent Clarifier
const InputSchema = z.object({
  userInput: z.string(),
  analysisData: z.object({
    "Clear Requirement Statement": z.string(),
    Certainties: z.object({
      "Target User Profile": z.string().optional(),
      "Target Market": z.string().optional(),
      "Must-Haves": z.array(z.string()),
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
  }),
});

// n8n competitor discovery response schema - matches actual N8N output
const N8NCompetitorSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  platform: z.array(z.string()).optional(),
  primary_job: z.string().optional(),
  target_user: z.string().optional(),
  evidence: z.object({
    homepage: z.string().optional(),
  }).optional(),
  confidence: z.number(),
});

// N8N returns either a single competitor or an array
const N8NResponseSchema = z.union([
  N8NCompetitorSchema,
  z.array(N8NCompetitorSchema),
]);

export async function POST(request: NextRequest) {
  try {
    console.log("[N8N Competitor Discovery] Received request");
    console.log("[N8N Competitor Discovery] Webhook URL:", N8N_WEBHOOK_URL);
    console.log("[N8N Competitor Discovery] API Key configured:", !!N8N_API_KEY);

    // Check if required environment variables are set
    if (!N8N_WEBHOOK_URL) {
      console.error("[N8N Competitor Discovery] Missing N8N_COMPETITOR_DISCOVERY_URL");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "N8N_COMPETITOR_DISCOVERY_URL environment variable is not configured"
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("[N8N Competitor Discovery] Request body:", JSON.stringify(body, null, 2));

    // Validate input
    const validatedInput = InputSchema.parse(body);
    console.log("[N8N Competitor Discovery] Input validated successfully");

    // Prepare payload for n8n - pass all fields from Intent Clarifier
    const payload = {
      userInput: validatedInput.userInput,
      requirementStatement: validatedInput.analysisData["Clear Requirement Statement"],
      certainties: {
        targetUserProfile: validatedInput.analysisData.Certainties["Target User Profile"],
        targetMarket: validatedInput.analysisData.Certainties["Target Market"],
        mustHaves: validatedInput.analysisData.Certainties["Must-Haves"],
        successCriteria: validatedInput.analysisData.Certainties["Success Criteria"],
        outOfScope: validatedInput.analysisData.Certainties["Out of Scope"],
      },
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

      const responseText = await response.text();
      console.log("[N8N Competitor Discovery] N8N raw response:", responseText);

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error("[N8N Competitor Discovery] Empty response from N8N");
        return NextResponse.json(
          {
            error: "N8N workflow returned empty response",
            details: "The competitor-discovery webhook may not be properly configured in N8N"
          },
          { status: 500 }
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("[N8N Competitor Discovery] N8N response:", data);
      } catch (parseError) {
        console.error("[N8N Competitor Discovery] Failed to parse N8N response:", parseError);
        console.error("[N8N Competitor Discovery] Raw response text:", responseText);
        return NextResponse.json(
          {
            error: "Invalid JSON response from N8N",
            details: responseText.substring(0, 500) // Return first 500 chars for debugging
          },
          { status: 500 }
        );
      }

      // Validate response structure
      try {
        const validatedData = N8NResponseSchema.parse(data);
        console.log("[N8N Competitor Discovery] Validation successful");

        // Normalize response: always return array format for next workflow
        const rawCompetitors = Array.isArray(validatedData) ? validatedData : [validatedData];

        // Transform N8N format to frontend format
        const competitors = rawCompetitors.map(comp => ({
          name: comp.name,
          tagline: comp.primary_job || comp.category || "No description available",
          website: comp.evidence?.homepage || "",
          lastUpdate: new Date().toISOString().split('T')[0], // Use current date as placeholder
          confidence: comp.confidence,
        }));

        const response = {
          competitors,
          totalFound: competitors.length,
        };

        console.log("[N8N Competitor Discovery] Returning transformed data:", JSON.stringify(response, null, 2));
        return NextResponse.json(response);
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
      console.error("[N8N Competitor Discovery] Webhook URL was:", N8N_WEBHOOK_URL);
      return NextResponse.json(
        {
          error: "Failed to connect to N8N webhook",
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          webhookUrl: N8N_WEBHOOK_URL.replace(/\/\/[^@]+@/, '//***@') // Hide credentials if any
        },
        { status: 502 }
      );
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
