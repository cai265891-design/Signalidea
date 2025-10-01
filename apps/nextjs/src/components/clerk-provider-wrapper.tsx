"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  // Check if Clerk keys are available
  const hasClerkKeys = typeof window !== 'undefined'
    ? !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    : true; // Always render on server side

  if (!hasClerkKeys && typeof window !== 'undefined') {
    console.warn("Clerk keys not configured. Authentication features will be disabled.");
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""}
      signInUrl="/login-clerk"
      signUpUrl="/register"
    >
      {children}
    </ClerkProvider>
  );
}