#!/bin/bash

# Export default values for all required environment variables
export CI=1
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_test_aHVtYmxlLXRyb2xsLTMxLmNsZXJrLmFjY291bnRzLmRldiQ}"
export CLERK_SECRET_KEY="${CLERK_SECRET_KEY:-sk_test_6wqbPofYobmQc3FWEzgETz6WJvIR43BEQEHaYbRMf4}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-build-placeholder-secret}"
export GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-placeholder}"
export GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-placeholder}"
export STRIPE_API_KEY="${STRIPE_API_KEY:-sk_test_placeholder}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_placeholder}"
export POSTGRES_URL="${POSTGRES_URL:-postgresql://user:pass@localhost/db}"
export RESEND_API_KEY="${RESEND_API_KEY:-re_placeholder}"
export RESEND_FROM="${RESEND_FROM:-noreply@example.com}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://example.com}"

# Run the build
bun run build:vercel