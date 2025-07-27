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

1. Modify `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name description`
3. Run `pnpm postinstall` to regenerate Prisma client

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
