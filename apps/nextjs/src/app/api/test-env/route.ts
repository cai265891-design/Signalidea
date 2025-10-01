import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Set" : "Not set",
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "Set" : "Not set",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
    VERCEL: process.env.VERCEL || "Not set",
    CI: process.env.CI || "Not set",
  });
}