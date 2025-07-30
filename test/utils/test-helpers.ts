import { expect } from 'vitest'
import { PrismaClient, User, Todo } from '@/generated/prisma'
import { PrismaD1 } from '@prisma/adapter-d1'
import { env } from 'cloudflare:test'
import type { AuthUser } from '@/lib/auth-types'
import { type Hono } from 'hono'

// Test data factories
export const testUserFactory = {
  build: (overrides: Partial<User> = {}): Omit<User, 'id'> => ({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
    ...overrides,
  }),

  create: async (
    prisma: PrismaClient,
    overrides: Partial<User> = {}
  ): Promise<User> => {
    return await prisma.user.create({
      data: {
        id: overrides.id || `test-user-${Date.now()}`,
        ...testUserFactory.build(overrides),
      },
    })
  },

  createAuthUser: (user: User): AuthUser => ({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    image: user.image,
  }),
}

export const testTodoFactory = {
  build: (overrides: Partial<Todo> = {}): Omit<Todo, 'id'> => ({
    title: 'Test Todo',
    completed: false,
    userId: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  create: async (
    prisma: PrismaClient,
    userId: string,
    overrides: Partial<Todo> = {}
  ): Promise<Todo> => {
    return await prisma.todo.create({
      data: {
        ...testTodoFactory.build({ userId, ...overrides }),
      },
    })
  },

  createMany: async (
    prisma: PrismaClient,
    userId: string,
    count: number,
    overrides: Partial<Todo> = {}
  ): Promise<Todo[]> => {
    const todos: Todo[] = []
    for (let i = 0; i < count; i++) {
      const todo = await testTodoFactory.create(prisma, userId, {
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
  const adapter = new PrismaD1(env.DATABASE)
  return new PrismaClient({ adapter })
}

export const cleanupDatabase = async (prisma: PrismaClient) => {
  // Order matters due to foreign key constraints
  await prisma.todo.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.user.deleteMany({})
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
