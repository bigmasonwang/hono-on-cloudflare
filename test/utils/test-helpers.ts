import { expect } from 'vitest'
import { createKyselyClient, type KyselyClient } from '@/lib/kysely'
import type { User, Todo } from '@/lib/database-types'
import { env } from 'cloudflare:test'
import type { AuthUser } from '@/lib/auth-types'
import { type Hono } from 'hono'

// Test data factories
export const testUserFactory = {
  build: (overrides: Partial<User> = {}): Omit<User, 'id'> => ({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    image: null,
    ...overrides,
  }),

  create: async (
    db: KyselyClient,
    overrides: Partial<User> = {}
  ): Promise<User> => {
    const userData = {
      id: overrides.id || `test-user-${Date.now()}`,
      ...testUserFactory.build(overrides),
    }

    return await db
      .insertInto('user')
      .values(userData)
      .returningAll()
      .executeTakeFirstOrThrow()
  },

  createAuthUser: (user: User): AuthUser => ({
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    name: user.name,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    image: user.image,
  }),
}

export const testTodoFactory = {
  build: (overrides: Partial<Todo> = {}): Omit<Todo, 'id'> => ({
    title: 'Test Todo',
    completed: false,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  create: async (
    db: KyselyClient,
    userId: string,
    overrides: Partial<Todo> = {}
  ): Promise<Todo> => {
    const todoData = {
      ...testTodoFactory.build({ userId, ...overrides }),
    }

    const result = await db
      .insertInto('Todo')
      .values(todoData)
      .returningAll()
      .executeTakeFirstOrThrow()

    // Normalize boolean for consistency
    return {
      ...result,
      completed: Boolean(result.completed),
    }
  },

  createMany: async (
    db: KyselyClient,
    userId: string,
    count: number,
    overrides: Partial<Todo> = {}
  ): Promise<Todo[]> => {
    const todos: Todo[] = []
    for (let i = 0; i < count; i++) {
      const todo = await testTodoFactory.create(db, userId, {
        title: `Test Todo ${i + 1}`,
        ...overrides,
      })
      todos.push(todo)
    }
    return todos
  },
}

// Database setup and cleanup utilities
export const setupTestDatabase = () => {
  return createKyselyClient(env.DATABASE)
}

export const cleanupDatabase = async (db: KyselyClient) => {
  // Order matters due to foreign key constraints
  await db.deleteFrom('Todo').execute()
  await db.deleteFrom('session').execute()
  await db.deleteFrom('account').execute()
  await db.deleteFrom('verification').execute()
  await db.deleteFrom('user').execute()
}

// Request helper utilities
export type RequestOptions = {
  method?: string
  headers?: Record<string, string>
  body?: string
}

export const makeRequest = async (
  app: Hono<any>,
  path: string,
  options: RequestOptions = {}
) => {
  return await app.request(path, options, env)
}

export const makeJsonRequest = async (
  app: Hono<any>,
  path: string,
  method: string,
  body: any
) => {
  return await makeRequest(app, path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Response parsing utilities
export const parseJsonResponse = async <T = any>(
  response: Response
): Promise<T> => {
  return (await response.json()) as T
}

// Common test assertions
export const expectErrorResponse = async (
  response: Response,
  status: number,
  errorMessage: string
) => {
  expect(response.status).toBe(status)
  const error = await parseJsonResponse<{ error: string }>(response)
  expect(error.error).toBe(errorMessage)
}

export const expectValidationError = async (response: Response) => {
  expect(response.status).toBe(400)
  const error = await parseJsonResponse<{ success: boolean; error: any }>(
    response
  )
  expect(error.success).toBe(false)
  expect(error.error).toBeDefined()
}

export const expectAuthenticationError = async (response: Response) => {
  await expectErrorResponse(response, 401, 'Authentication required')
}

export const expectNotFoundError = async (
  response: Response,
  resource = 'Todo'
) => {
  await expectErrorResponse(response, 404, `${resource} not found`)
}
