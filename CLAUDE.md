# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development workflow:**

```bash
pnpm install                    # Install dependencies
pnpm run db:migrate:local       # Apply database migrations locally
pnpm run dev                    # Start development server with Wrangler
```

**Database management:**

```bash
pnpm run db:migrate:local       # Apply migrations to local D1 database
pnpm run db:migrate:remote      # Apply migrations to remote D1 database
```

**Testing:**

```bash
pnpm test                       # Run all tests using Vitest with Cloudflare Workers pool
vitest test/controllers/todo.test.ts  # Run specific test file
```

**Type checking and building:**

```bash
pnpm run type-check            # TypeScript type checking only
pnpm run build:types           # Build types without emit
pnpm run build                 # Full TypeScript build
pnpm run cf-typegen            # Generate Cloudflare binding types
```

**Deployment:**

```bash
pnpm run deploy                # Deploy to Cloudflare Workers with minification
```

## Architecture Overview

### Framework Stack

- **Hono**: Web framework optimized for Cloudflare Workers
- **Prisma**: ORM with D1 adapter for Cloudflare D1 (SQLite) database
- **Zod**: Schema validation with Hono validator integration
- **TypeScript**: Strict typing with path aliases (`@/*` → `src/*`)

### Application Structure

**Layered Controller Architecture:**

- `src/index.ts` - Main app with typed routes export (`AppType`)
- `src/controllers/api-controller.ts` - API middleware layer with Prisma setup
- `src/controllers/todo-controller.ts` - Feature-specific CRUD operations

**Database Layer:**

- Prisma generates client to `src/generated/prisma/` (custom output path)
- PrismaD1 adapter integrates with Cloudflare D1 SQLite database
- Migrations in `migrations/` directory

**Type-Safe RPC Client:**

- `src/client.ts` provides pre-compiled RPC types for better IDE performance
- Use `hcWithType()` instead of raw `hc<AppType>()` for optimized TypeScript compilation

### Key Patterns

**Dependency Injection:**
The api-controller uses Hono context variables to inject Prisma:

```typescript
.use('*', async (c, next) => {
  const adapter = new PrismaD1(c.env.DATABASE)
  const prisma = new PrismaClient({ adapter })
  c.set('prisma', prisma)
  await next()
})
```

**Auth Type Extraction:**
To avoid circular dependencies with Better Auth, types are extracted in `src/lib/auth-types.ts`:

```typescript
// Create a dummy auth instance for type inference
declare const dummyPrisma: PrismaClient
const authTypeHelper = betterAuth({
  database: prismaAdapter(dummyPrisma, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
})

// Export the types
export type AuthUser = typeof authTypeHelper.$Infer.Session.user
export type AuthSession = typeof authTypeHelper.$Infer.Session.session
```

These types are then used throughout the app for type-safe auth handling.

**Request Validation:**
Controllers use `zValidator` with Zod schemas for type-safe request validation with automatic error responses.

**Cloudflare Bindings:**
The app uses typed Cloudflare bindings (`CloudflareBindings`) - generate types with `pnpm run cf-typegen`.

### Testing Environment

**Vitest with Cloudflare Workers Pool:**

- Tests run in actual Cloudflare Workers runtime
- D1 database migrations automatically applied via `TEST_MIGRATIONS` binding
- Clean database state in `beforeEach` hooks
- Uses `cloudflare:test` env for accessing Worker bindings

### Development Notes

**Database Schema Changes:**

This app uses Wrangler for D1 migrations instead of Prisma Migrate. Follow these steps:

1. Modify `prisma/schema.prisma` with your schema changes
2. Generate migration SQL using Prisma's diff tool:

   ```bash
   # For initial migration from empty database
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output migrations/XXXX_description.sql

   # For subsequent migrations (comparing against current D1 database)
   npx prisma migrate diff --from-local-d1 --to-schema-datamodel prisma/schema.prisma --script --output migrations/XXXX_description.sql
   ```

3. Or manually create a migration file:
   ```bash
   wrangler d1 migrations create DATABASE migration_name
   ```
4. Review and edit the generated SQL if needed (especially for data migrations)
5. Apply migrations:
   ```bash
   pnpm run db:migrate:local   # Apply to local D1 database
   pnpm run db:migrate:remote  # Apply to remote D1 database
   ```
6. Regenerate Prisma client: `pnpm postinstall`

**Important Migration Considerations:**

- D1 doesn't support transactions, so migrations should be carefully tested
- When adding NOT NULL columns to existing tables, ensure you handle existing data
- The `migrations/` directory contains raw SQL files executed by Wrangler
- Migration files are numbered sequentially (0001, 0002, etc.)
- Always test migrations locally before applying to remote database

**Adding New Routes:**

1. Create controller in `src/controllers/`
2. Import and mount in `api-controller.ts` or `index.ts`
3. Type safety maintained through `AppType` export

**RPC Client Usage:**

```typescript
import { hcWithType } from '@/client'
const client = hcWithType('http://localhost:8787/')
const todos = await client.api.todos.$get()
```

## AI Chat Integration

### Overview

The application includes an AI-powered chat feature using:

- **AI SDK v5**: Unified AI integration with streaming support
- **OpenAI**: GPT-3.5-turbo model for chat completions
- **Streaming UI**: Real-time message streaming with loading states

### Setup

1. **Configure OpenAI API Key:**

   ```bash
   # For local development, add to wrangler.jsonc vars section
   # For production, use Wrangler secrets
   wrangler secret put OPENAI_API_KEY
   ```

2. **Chat Route Structure:**
   - Backend: `src/routes/chat.ts` - Handles AI streaming with `toUIMessageStreamResponse()`
   - Frontend: `frontend/src/routes/chat.tsx` - Protected route with authentication
   - Component: `frontend/src/components/ChatContent.tsx` - Reusable chat UI

### Key Implementation Details

**Backend Chat Endpoint:**

- Uses `streamText` from AI SDK for streaming responses
- Converts UI messages to core messages with `convertToCoreMessages()`
- Returns streaming response with `toUIMessageStreamResponse()`

**Frontend Chat Hook:**

- Uses `useChat` from `@ai-sdk/react`
- Manual input state management (v5 requirement)
- Status-based loading indicators:
  - `submitted`: Show loading dots
  - `streaming`: Show AI response
  - `ready`: Enable input

**Authentication Protection:**

- Chat route requires authentication
- Redirects to login if not authenticated
- Shows personalized greeting with user email

### Chat UI Features

- Auto-scrolling to latest messages
- Loading animation during AI response wait
- Disabled input during message processing
- Responsive design with shadcn/ui components
- Avatar indicators for user/assistant messages
