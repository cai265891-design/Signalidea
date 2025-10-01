import { NextRequest, NextResponse } from "next/server";

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
};

export async function clerkMiddlewareSafe(req: NextRequest) {
  if (!isClerkConfigured()) {
    // Clerk not configured, allow all requests
    return NextResponse.next();
  }

  // Dynamically import Clerk middleware only if configured
  try {
    const { middleware } = await import("./clerk");
    return middleware(req);
  } catch (error) {
    console.error("Error loading Clerk middleware:", error);
    return NextResponse.next();
  }
}