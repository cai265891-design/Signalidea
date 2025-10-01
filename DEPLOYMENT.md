# Vercel Deployment Guide

This monorepo contains multiple applications that need to be deployed separately on Vercel.

## Main Application (apps/nextjs)

### Vercel Project Settings:
- **Framework Preset**: Next.js
- **Root Directory**: Leave empty (uses repository root)
- **Build Command**: `bun run build` (automatically excludes auth-proxy)
- **Output Directory**: `apps/nextjs/.next`
- **Install Command**: `bun install`

### Required Environment Variables:
```
NEXTAUTH_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
DATABASE_URL
RESEND_API_KEY
CLERK_SECRET_KEY (if using Clerk)
```

## Auth Proxy (apps/auth-proxy) - Optional Separate Deployment

If you need to deploy the auth-proxy as a separate service:

### Create a New Vercel Project:
1. Create a new project in Vercel
2. Connect it to the same repository
3. Configure with these settings:

- **Framework Preset**: Other
- **Root Directory**: `apps/auth-proxy`
- **Build Command**: `cd ../.. && bun install && cd apps/auth-proxy && bun run build`
- **Output Directory**: `.vercel/output`
- **Install Command**: Skip (handled in build command)

### Required Environment Variables:
```
AUTH_SECRET
AUTH_REDIRECT_PROXY_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

## Important Notes

1. The main build command (`bun run build`) automatically excludes auth-proxy from the build
2. The `.vercelignore` file ensures auth-proxy is not included in the main deployment
3. If you need to build everything locally, use `bun run build:all`