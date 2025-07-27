# Hono API Server on Cloudflare

A modern, type-safe REST API built with [Hono](https://hono.dev/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/). Features a Todo API with full CRUD operations, Prisma ORM with D1 database integration, and comprehensive testing.

## ✨ Features

- **🚀 Hono Framework** - Ultra-fast web framework optimized for edge runtime
- **🗄️ Cloudflare D1** - Serverless SQLite database with Prisma ORM
- **📝 Type-Safe API** - Full TypeScript support with Zod validation
- **🔄 RPC Client** - Pre-compiled type-safe client for optimal performance
- **🧪 Testing Suite** - Vitest with Cloudflare Workers runtime testing
- **⚡ Edge Deployment** - Global deployment on Cloudflare's edge network

## 🛠️ Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Runtime platform
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - SQLite database
- [Prisma](https://prisma.io/) - Database ORM with D1 adapter
- [Zod](https://zod.dev/) - Schema validation
- [Vitest](https://vitest.dev/) - Testing framework
- [TypeScript](https://typescriptlang.org/) - Type safety

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) package manager
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (for deployment)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (installed via dependencies)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/bigmasonwang/hono-on-cloudflare.git
cd hono-on-cloudflare
pnpm install
```

### 2. Database Setup

Create a local D1 database and apply migrations:

```bash
# Create local D1 database (first time only)
npx wrangler d1 create todo-db

# Apply database migrations locally
pnpm run db:migrate:local
```

### 3. Development

Start the development server:

```bash
pnpm run dev
```

The API will be available at `http://localhost:8787`

### 4. Test the API

```bash
# Get all todos
curl http://localhost:8787/api/todos

# Create a new todo
curl -X POST http://localhost:8787/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Hono"}'
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test test/controllers/todo.test.ts

# Type checking
pnpm run type-check
```

## 📖 API Endpoints

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| GET    | `/api/todos`     | Get all todos       |
| POST   | `/api/todos`     | Create a new todo   |
| GET    | `/api/todos/:id` | Get a specific todo |
| PUT    | `/api/todos/:id` | Update a todo       |
| DELETE | `/api/todos/:id` | Delete a todo       |

### Example Requests

**Create Todo:**

```bash
curl -X POST http://localhost:8787/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Complete the project"}'
```

**Update Todo:**

```bash
curl -X PUT http://localhost:8787/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "completed": true}'
```

## 🚀 Deployment

### 1. Setup Cloudflare D1 Database

```bash
# Create remote D1 database
npx wrangler d1 create todo-db

# Update wrangler.jsonc with your database ID
# Copy the database_id from the command output
```

### 2. Apply Migrations to Remote Database

```bash
pnpm run db:migrate:remote
```

### 3. Generate Cloudflare Types

```bash
pnpm run cf-typegen
```

### 4. Deploy to Cloudflare Workers

```bash
pnpm run deploy
```

Your API will be deployed to `https://hono-on-cloudflare.<your-subdomain>.workers.dev`

## 🔧 Development

### Adding New Routes

1. Create a new controller in `src/controllers/`
2. Import and mount it in `src/controllers/api-controller.ts`
3. Types are automatically inferred through the `AppType` export

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name your_migration_name`
3. Apply locally: `pnpm run db:migrate:local`
4. Regenerate Prisma client: `pnpm postinstall`

### Using the Type-Safe Client

```typescript
import { hcWithType } from '@/client'

const client = hcWithType('http://localhost:8787/')

// Fully typed API calls
const todos = await client.api.todos.$get()
const newTodo = await client.api.todos.$post({
  json: { title: 'Learn Hono RPC' },
})
```

## 📝 Project Structure

```
src/
├── index.ts              # Main application entry
├── client.ts             # Type-safe RPC client
├── controllers/
│   ├── api-controller.ts # API middleware & Prisma setup
│   └── todo-controller.ts # Todo CRUD operations
└── generated/
    └── prisma/           # Generated Prisma client

prisma/
└── schema.prisma         # Database schema

migrations/
└── *.sql                 # Database migrations

test/
├── test-setup.ts         # Test configuration
└── controllers/
    └── todo.test.ts      # API tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
