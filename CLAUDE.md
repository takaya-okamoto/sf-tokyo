# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A user hearing/feedback platform where companies collect user feedback through session recording and AI-driven interviews. Built as a Turborepo monorepo with two Next.js 15 apps sharing common packages.

## Commands

```bash
# Development
pnpm dev              # Start both apps (company:3001, user:3002)
pnpm build            # Build all apps with Turbo caching
pnpm lint             # Lint entire monorepo
pnpm format           # Prettier format

# Database (requires Docker)
pnpm db:start         # Start Supabase local (auto-applies migrations)
pnpm db:stop          # Stop Supabase
pnpm db:reset         # Reset DB and reapply migrations
pnpm db:types         # Regenerate TypeScript types from schema
```

## Architecture

### Apps
- **apps/company** (port 3001): Company dashboard for managing hearings and viewing results
- **apps/user** (port 3002): User portal for participating in hearing sessions

### Shared Packages
- **@repo/ui**: shadcn/ui component library (Button, Card, Form, Dialog, etc.)
- **@repo/database**: Auto-generated Supabase types (`pnpm db:types` to regenerate)
- **@repo/supabase**: Client initialization (`createBrowserClient`, `createServerClient`, `updateSession`)

### Database Tables
Core tables: `profiles`, `companies`, `company_members`, `hearing_requests`, `interview_sessions`, `recordings`, `event_logs`, `ai_interview_messages`, `ai_interview_summaries`

Enums: `user_role` (user/company/admin), `hearing_status` (draft/active/paused/completed/archived), `session_status` (pending/recording/interview/completed/cancelled)

## Key Patterns

### Supabase RLS Type Workaround
Due to RLS policies causing TypeScript `never` types, use this pattern:
```typescript
const { data } = await (supabase
  .from("table_name") as ReturnType<typeof supabase.from>)
  .select("*");
const typedData = data as ExpectedType | null;
```

### Package Imports
Always use workspace imports: `@repo/ui`, `@repo/database`, `@repo/supabase`

### Auth Middleware
Both apps use `middleware.ts` calling `updateSession()` from `@repo/supabase` for session management.

### Database Changes
1. Modify migrations in `supabase/migrations/`
2. Run `pnpm db:reset`
3. Run `pnpm db:types` to regenerate types

## Local Services

| Service | URL |
|---------|-----|
| Company App | http://localhost:3001 |
| User App | http://localhost:3002 |
| Supabase API | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |
| Email Testing | http://localhost:54324 |
