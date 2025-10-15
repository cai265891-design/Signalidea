import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env: {
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || "NOT_SET",
      N8N_COMPETITOR_DISCOVERY_URL: process.env.N8N_COMPETITOR_DISCOVERY_URL || "NOT_SET",
      N8N_API_KEY_SET: !!process.env.N8N_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
