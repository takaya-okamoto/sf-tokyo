# User Hearing Platform

A platform where companies can have users try their services and collect feedback through recording, log collection, and AI chat interviews.

## Tech Stack

| Area | Technology |
|------|------------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 15 (App Router, Turbopack) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| UI | shadcn/ui + Tailwind CSS |
| AI Chat | Vercel AI SDK + OpenAI (Phase 2) |

## Project Structure

```
sftokyo/
├── apps/
│   ├── company/          # Company app (port 3001)
│   └── user/             # User app (port 3000)
├── packages/
│   ├── ui/               # Shared UI components (shadcn/ui)
│   ├── database/         # Supabase type definitions
│   └── supabase/         # Shared Supabase client
└── supabase/
    └── migrations/       # DB migrations
```

## Requirements

- Node.js 18 or higher
- pnpm 9 or higher
- Docker (for Supabase Local Development)
- Supabase CLI

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

> **Note**: Supabase CLI is included as a dependency and will be installed automatically.
> Docker Desktop, Rancher Desktop, or Podman is required.

### 2. Start Supabase Local Environment

```bash
# Start Supabase local environment (requires Docker)
# Migrations are applied automatically
pnpm db:start
```

Upon completion, the following information will be displayed:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: ...
   S3 Secret Key: ...
       S3 Region: local
```

### 3. Configure Environment Variables

Create `.env.local` files in each app directory.

**apps/company/.env.local** and **apps/user/.env.local**:

```bash
# Supabase configuration (use values displayed by supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Service role key (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Alternatively, you can create a `.env.local` in the root directory and symlink it.

### 4. Start Development Server

```bash
# Start both apps simultaneously
pnpm dev
```

- **Company App**: http://company.localhost:3001
- **User App**: http://user.localhost:3002
- **Supabase Studio**: http://localhost:54323

## Account Registration and Sign In

### Company Account

1. Go to http://company.localhost:3001/signup
2. Enter the following information:
   - Company name
   - Email address
   - Password (6 characters or more)
3. Click the "Create Account" button
4. You will be automatically redirected to the dashboard

### User Account

1. Go to http://user.localhost:3002/signup
2. Enter the following information:
   - Display name
   - Email address
   - Password (6 characters or more)
3. Click the "Create Account" button
4. You will be automatically redirected to the home screen

### Sign In

- **Company**: http://company.localhost:3001/login
- **User**: http://user.localhost:3002/login

You can log in with your email address and password.

### About Email Verification

Email verification is disabled in the local development environment.
For production, you need to configure email settings in the Supabase dashboard.

Emails sent locally can be viewed in Inbucket (http://localhost:54324).

## Main Features

### Company App (company.localhost:3001)

| Page | Description |
|------|-------------|
| `/` | Dashboard - Statistics and recent sessions |
| `/hearings` | Hearings list - Create, edit, manage |
| `/hearings/new` | Create new hearing |
| `/hearings/[id]` | Edit hearing |
| `/hearings/[id]/results` | Session results list |
| `/results` | All session results |
| `/results/[sessionId]` | Session details (recording, logs, AI summary) |
| `/settings` | Company settings |
| `/settings/team` | Team member management |

### User App (user.localhost:3002)

| Page | Description |
|------|-------------|
| `/` | Hearings list - Available hearings to participate |
| `/requests/[id]` | Hearing details / Join |
| `/session/[id]` | Pre-session confirmation |
| `/session/[id]/recording` | Recording screen |
| `/interview/[id]` | AI chat interview |
| `/history` | Participation history |
| `/profile` | Profile settings |

## Database Schema

### Main Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `companies` | Company information |
| `company_members` | Company members (multi-user support) |
| `hearing_requests` | Hearing requests |
| `interview_sessions` | Interview sessions |
| `recordings` | Recording data |
| `event_logs` | Event logs (click, scroll, etc.) |
| `ai_interview_messages` | AI chat messages |
| `ai_interview_summaries` | AI summaries |

### Enum Definitions

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('user', 'company', 'admin');

-- Hearing status
CREATE TYPE hearing_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- Session status
CREATE TYPE session_status AS ENUM ('pending', 'recording', 'interview', 'completed', 'cancelled');
```

## Supabase Studio

In the local environment, you can access Supabase Studio at http://localhost:54323.

### Main Features

- **Table Editor**: View and edit table data
- **SQL Editor**: Execute SQL queries
- **Authentication**: User management
- **Storage**: File storage management
- **Logs**: Application logs

## Useful Commands

```bash
# Start development server
pnpm dev

# Build
pnpm build

# Start Supabase
pnpm db:start

# Stop Supabase
pnpm db:stop

# Check Supabase status
pnpm db:status

# Reset database (reapply migrations)
pnpm db:reset

# Generate type definitions
pnpm db:types
```

## Troubleshooting

### Supabase Won't Start

```bash
# Verify Docker is running
docker ps

# Reset Supabase
pnpm db:stop
pnpm db:start
```

### Want to Reset the Database

```bash
# Delete all data and reapply migrations
pnpm db:reset
```

### Type Errors Occurring

```bash
# Regenerate type definitions
pnpm db:types
```

### Can't Log In

1. Check the `profiles` table in Supabase Studio
2. Verify the user's `role` is correct (company: `company`, user: `user`)
3. Modify data as needed

## Production Deployment

### Create Supabase Project

1. Create a project at https://supabase.com
2. Get the project URL and anon key
3. Set environment variables for production

### Deploy to Vercel

```bash
# Deploy with Vercel CLI
vercel
```

Set environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

MIT
