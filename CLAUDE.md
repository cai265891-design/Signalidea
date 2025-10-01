# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SignalIdea (Saasfly) is an enterprise-grade Next.js SaaS boilerplate using a Turborepo monorepo architecture with full TypeScript support.

## Essential Commands

### Development
```bash
# Start all development servers
bun run dev

# Start web development only (recommended for most development)
bun run dev:web

# Start specific app development
cd apps/nextjs && bun with-env next dev
```

### Code Quality
```bash
# Run linting
bun run lint
bun run lint:fix  # Auto-fix

# Format code
bun run format
bun run format:fix  # Auto-fix

# Type checking
bun run typecheck
```

### Building & Testing
```bash
# Build all packages
bun run build

# Database operations
bun db:push  # Push schema changes

# Clean workspace
bun run clean

# Generate new components/packages
bun run gen
```

## Architecture Overview

### Monorepo Structure
- **apps/nextjs**: Main Next.js 14 application with App Router
- **apps/auth-proxy**: Authentication proxy service
- **packages/api**: tRPC API layer with type-safe endpoints
- **packages/db**: Database schema (Kysely + Prisma)
- **packages/auth**: Authentication utilities (NextAuth.js/Clerk)
- **packages/stripe**: Payment integration
- **packages/ui**: Shared UI components (shadcn/ui based)
- **tooling/**: Shared configurations (ESLint, Prettier, TypeScript, Tailwind)

### Key Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: tRPC for APIs, Kysely for queries, Prisma for schema
- **Database**: PostgreSQL
- **Authentication**: Clerk (transitioning from NextAuth.js after June 2025)
- **Payments**: Stripe integration
- **State**: Zustand, React Query (TanStack Query)

### Important Patterns

#### API Development (tRPC)
All API endpoints are in `packages/api/src/router/`. The tRPC setup provides:
- End-to-end type safety
- Automatic TypeScript inference
- React Query integration

Example location: `packages/api/src/router/post.ts`

#### Database Queries
- Schema definitions: `packages/db/prisma/schema.prisma`
- Type-safe queries: `packages/db/src/schema/` using Kysely
- Migrations: Use Prisma for schema management

#### Component Development
- Shared components: `packages/ui/src/`
- App-specific components: `apps/nextjs/src/components/`
- Use shadcn/ui patterns and Radix UI primitives
- Style with Tailwind CSS utilities

#### Authentication Flow
- Middleware: `apps/nextjs/src/middleware.ts`
- Auth config: `packages/auth/src/`
- Protected routes handled via middleware

### Environment Variables
Create `.env.local` in root with:
- `DATABASE_URL`: PostgreSQL connection
- `NEXTAUTH_SECRET` / `CLERK_SECRET_KEY`: Auth secrets
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Payment keys
- `RESEND_API_KEY`: Email service

### Content Management
MDX content processed via Contentlayer2:
- Configuration: `apps/nextjs/contentlayer.config.ts`
- Content types: Docs, Guides, Blog Posts, Authors, Pages
- Location: `apps/nextjs/src/content/`

### Development Tips

#### Working with the Monorepo
- Changes in packages automatically reflect in apps during development
- Use `workspace:*` for internal package dependencies
- Turbo caches builds for efficiency

#### Adding New Features
1. API endpoints: Add to `packages/api/src/router/`
2. Database changes: Update schema in `packages/db/prisma/schema.prisma`, then run `bun db:push`
3. UI components: Add to `packages/ui/src/` for shared, or app-specific location
4. New pages: Create in `apps/nextjs/src/app/` following App Router conventions

#### Type Safety
- All API calls are fully typed through tRPC
- Database queries are type-safe via Kysely
- Use TypeScript strict mode throughout

### Common Tasks

#### Creating a New API Endpoint
1. Add router in `packages/api/src/router/[name].ts`
2. Export from `packages/api/src/root.ts`
3. Use in frontend via tRPC hooks

#### Adding a New Database Table
1. Update `packages/db/prisma/schema.prisma`
2. Run `bun db:push` to update database
3. Create Kysely types in `packages/db/src/schema/`

#### Implementing a New UI Component
1. Check if similar exists in `packages/ui/src/`
2. Follow shadcn/ui patterns with Radix UI
3. Use Tailwind CSS for styling
4. Add to `packages/ui/src/index.ts` for export