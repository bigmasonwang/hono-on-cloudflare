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
- **Kysely**: Type-safe SQL query builder with D1 dialect for Cloudflare D1 (SQLite) database
- **Zod**: Schema validation with Hono validator integration
- **TypeScript**: Strict typing with path aliases (`@/*` → `src/*`)

### Application Structure

**Layered Controller Architecture:**

- `src/index.ts` - Main app with typed routes export (`AppType`)
- `src/factories/app-factory.ts` - Factory for creating typed Hono app instances
- `src/routes/todos.ts` - Feature-specific CRUD operations

**Database Layer:**

- Kysely with D1 dialect for type-safe SQL query building
- Database types defined in `src/lib/database-types.ts`
- Kysely client initialization in `src/lib/kysely.ts`
- Migrations in `migrations/` directory

**Type-Safe RPC Client:**

- `src/client.ts` provides pre-compiled RPC types for better IDE performance
- Use `hcWithType()` instead of raw `hc<AppType>()` for optimized TypeScript compilation

### Key Patterns

**Dependency Injection:**
The application uses Hono context variables to inject Kysely database client:

```typescript
// src/middleware/kysely.ts
export const kyselyMiddleware = async (c: Context<Contexts>, next: Next) => {
  const db = createKyselyClient(c.env.DATABASE)
  c.set('db', db)
  return next()
}
```

**Auth Integration:**
Better Auth is configured with Kysely in `src/lib/auth.ts`:

```typescript
export const createAuth = (env: CloudflareBindings) => {
  const db = createKyselyClient(env.DATABASE)

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    database: { db },
    emailAndPassword: { enabled: true },
  })
}
```

Auth types are extracted in `src/lib/auth-types.ts` for type-safe auth handling throughout the application.

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

This app uses Wrangler for D1 migrations. Follow these steps:

1. Update type definitions in `src/lib/database-types.ts` to match your desired schema
2. Create a migration file:
   ```bash
   wrangler d1 migrations create DATABASE migration_name
   ```
3. Write your SQL migration in the generated file in `migrations/` directory
4. Apply migrations:
   ```bash
   pnpm run db:migrate:local   # Apply to local D1 database
   pnpm run db:migrate:remote  # Apply to remote D1 database
   ```
5. The Kysely types in `database-types.ts` provide compile-time type safety

**Database Type Helpers:**

Kysely provides type helpers for working with database operations:

```typescript
import type { Todo, NewTodo, TodoUpdate } from '@/lib/database-types'

// Selectable<TodoTable> - for reading data
// Insertable<TodoTable> - for inserting data
// Updateable<TodoTable> - for updating data
```

**Important Migration Considerations:**

- D1 doesn't support transactions, so migrations should be carefully tested
- When adding NOT NULL columns to existing tables, ensure you handle existing data
- The `migrations/` directory contains raw SQL files executed by Wrangler
- Migration files are numbered sequentially (0001, 0002, etc.)
- Always test migrations locally before applying to remote database

**Adding New Routes:**

1. Create route file in `src/routes/`
2. Import and mount in your app factory or main index file
3. Use the typed context `Contexts` from `app-factory.ts` for type safety
4. Access the Kysely client with `c.get('db')`

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
