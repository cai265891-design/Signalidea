#!/bin/bash

# Build script for Vercel deployment
echo "Starting Vercel build process..."

# Set CI environment variable
export CI=1

# Check if we're in Vercel environment
if [ "$VERCEL" = "1" ]; then
    echo "Running in Vercel environment"

    # Use Vercel environment variables if available, otherwise use defaults
    export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_test_aHVtYmxlLXRyb2xsLTMxLmNsZXJrLmFjY291bnRzLmRldiQ}"
    export CLERK_SECRET_KEY="${CLERK_SECRET_KEY:-sk_test_6wqbPofYobmQc3FWEzgETz6WJvIR43BEQEHaYbRMf4}"

    # Set default values for other required variables if not provided
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-build-time-secret}"
    export GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-placeholder}"
    export GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-placeholder}"
    export STRIPE_API_KEY="${STRIPE_API_KEY:-sk_test_placeholder}"
    export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_placeholder}"
    export POSTGRES_URL="${POSTGRES_URL:-postgresql://user:pass@localhost/db}"
    export RESEND_API_KEY="${RESEND_API_KEY:-re_placeholder}"
    export RESEND_FROM="${RESEND_FROM:-noreply@example.com}"
    export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://example.com}"
else
    echo "Running in local environment"
    # Copy .env.build for local testing
    if [ -f ".env.build" ]; then
        cp .env.build .env.local
        echo "Copied .env.build to .env.local"
    fi
fi

# Navigate to Next.js app directory
cd apps/nextjs || exit 1

# Run the build
echo "Running Next.js build..."
bun run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
else
    echo "Build failed!"
    exit 1
fi