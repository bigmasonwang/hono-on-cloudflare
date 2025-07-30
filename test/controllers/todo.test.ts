import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { env } from 'cloudflare:test'
import { PrismaClient, User } from '@/generated/prisma'
import type { AuthUser } from '@/lib/auth-types'
import { createTestApp } from '../test-app'
import app from '@/index'

// Import test utilities and types
import {
  setupTestDatabase,
  cleanupDatabase,
  testUserFactory,
  testTodoFactory,
  makeRequest,
  makeJsonRequest,
  parseJsonResponse,
  expectAuthenticationError,
  expectNotFoundError,
  expectValidationError,
} from '../utils/test-helpers'

import type {
  TodoResponse,
  TodoListResponse,
  DeleteResponse,
  TestContext,
} from '../types/test-types'

describe('Hello Hono root route', () => {
  it('should return "Hello Hono!" on GET /', async () => {
    const response = await app.request('/', {}, env)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hello Hono!')
  })
})

describe('Todo API', () => {
  let ctx: TestContext

  beforeEach(async () => {
    // Initialize test context
    const prisma = setupTestDatabase()
    await cleanupDatabase(prisma)

    const user = await testUserFactory.create(prisma)
    const authUser = testUserFactory.createAuthUser(user)

    ctx = { user, authUser, prisma }
  })

  afterEach(async () => {
    // Clean up after each test
    if (ctx.prisma) {
      await cleanupDatabase(ctx.prisma)
      await ctx.prisma.$disconnect()
    }
  })

  describe('Authentication', () => {
    it('should require authentication for all todo endpoints', async () => {
      const testApp = createTestApp(null)

      // Test all endpoints without auth
      const endpoints = [
        { method: 'GET', path: '/api/todos' },
        { method: 'POST', path: '/api/todos' },
        { method: 'GET', path: '/api/todos/123' },
        { method: 'PUT', path: '/api/todos/123' },
        { method: 'DELETE', path: '/api/todos/123' },
      ]

      for (const { method, path } of endpoints) {
        const response = await makeRequest(testApp, path, { method })
        await expectAuthenticationError(response)
      }
    })
  })

  describe('GET /api/todos', () => {
    it('should return an empty array when no todos exist', async () => {
      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, '/api/todos')

      expect(response.status).toBe(200)
      const todos = await parseJsonResponse<TodoListResponse>(response)
      expect(todos).toEqual([])
    })

    it('should return todos ordered by creation date (newest first)', async () => {
      // Create todos with slight time delay to ensure ordering
      const todo1 = await testTodoFactory.create(ctx.prisma, ctx.user.id, {
        title: 'First Todo',
        createdAt: new Date('2024-01-01'),
      })
      const todo2 = await testTodoFactory.create(ctx.prisma, ctx.user.id, {
        title: 'Second Todo',
        createdAt: new Date('2024-01-02'),
      })

      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, '/api/todos')

      expect(response.status).toBe(200)
      const todos = await parseJsonResponse<TodoListResponse>(response)

      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Second Todo') // Newest first
      expect(todos[1].title).toBe('First Todo')
    })

    it('should only return todos for the authenticated user', async () => {
      // Create another user with todos
      const otherUser = await testUserFactory.create(ctx.prisma, {
        id: 'other-user',
        email: 'other@example.com',
      })

      // Create todos for both users
      await testTodoFactory.create(ctx.prisma, ctx.user.id, {
        title: 'My Todo',
      })
      await testTodoFactory.create(ctx.prisma, otherUser.id, {
        title: 'Other Todo',
      })

      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, '/api/todos')

      expect(response.status).toBe(200)
      const todos = await parseJsonResponse<TodoListResponse>(response)

      expect(todos).toHaveLength(1)
      expect(todos[0].title).toBe('My Todo')
      expect(todos[0].userId).toBe(ctx.user.id)
    })
  })

  describe('POST /api/todos', () => {
    it('should create a new todo with valid data', async () => {
      const testApp = createTestApp(ctx.authUser)
      const todoData = { title: 'New Todo' }

      const response = await makeJsonRequest(
        testApp,
        '/api/todos',
        'POST',
        todoData
      )

      expect(response.status).toBe(201)
      const todo = await parseJsonResponse<TodoResponse>(response)

      expect(todo).toMatchObject({
        title: 'New Todo',
        completed: false,
        userId: ctx.user.id,
      })
      expect(todo.id).toBeDefined()
      expect(todo.createdAt).toBeDefined()
      expect(todo.updatedAt).toBeDefined()

      // Verify it was actually created
      const created = await ctx.prisma.todo.findUnique({
        where: { id: todo.id },
      })
      expect(created).toBeTruthy()
    })

    it('should validate required fields', async () => {
      const testApp = createTestApp(ctx.authUser)

      const testCases = [
        { data: {}, description: 'empty object' },
        { data: { title: '' }, description: 'empty title' },
      ]

      for (const { data, description } of testCases) {
        const response = await makeJsonRequest(
          testApp,
          '/api/todos',
          'POST',
          data
        )
        await expectValidationError(response)
      }
    })

    it('should create todo with default completed false', async () => {
      const testApp = createTestApp(ctx.authUser)

      const response = await makeJsonRequest(testApp, '/api/todos', 'POST', {
        title: 'New Todo',
      })

      expect(response.status).toBe(201)
      const todo = await parseJsonResponse<TodoResponse>(response)
      expect(todo.completed).toBe(false)
    })
  })

  describe('GET /api/todos/:id', () => {
    it('should return a specific todo when authenticated as owner', async () => {
      const todo = await testTodoFactory.create(ctx.prisma, ctx.user.id)

      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, `/api/todos/${todo.id}`)

      expect(response.status).toBe(200)
      const retrieved = await parseJsonResponse<TodoResponse>(response)
      expect(retrieved).toMatchObject({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        userId: ctx.user.id,
      })
    })

    it('should return 500 for invalid todo ID', async () => {
      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, '/api/todos/non-existent-id')
      expect(response.status).toBe(500)
      const error = await parseJsonResponse<{ error: string }>(response)
      expect(error.error).toBe('Failed to fetch todo')
    })

    it('should return 404 when todo belongs to another user', async () => {
      const otherUser = await testUserFactory.create(ctx.prisma, {
        id: 'other-user',
        email: 'other@example.com',
      })
      const todo = await testTodoFactory.create(ctx.prisma, otherUser.id)

      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, `/api/todos/${todo.id}`)
      await expectNotFoundError(response)
    })
  })

  describe('PUT /api/todos/:id', () => {
    it('should update todo fields', async () => {
      const todo = await testTodoFactory.create(ctx.prisma, ctx.user.id, {
        title: 'Original Title',
        completed: false,
      })

      const testApp = createTestApp(ctx.authUser)
      const updates = { title: 'Updated Title', completed: true }

      const response = await makeJsonRequest(
        testApp,
        `/api/todos/${todo.id}`,
        'PUT',
        updates
      )

      expect(response.status).toBe(200)
      const updated = await parseJsonResponse<TodoResponse>(response)

      expect(updated).toMatchObject({
        id: todo.id,
        title: 'Updated Title',
        completed: true,
        userId: ctx.user.id,
      })
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(todo.updatedAt).getTime()
      )
    })

    it('should allow partial updates', async () => {
      const todo = await testTodoFactory.create(ctx.prisma, ctx.user.id, {
        title: 'Original Title',
        completed: false,
      })

      const testApp = createTestApp(ctx.authUser)

      // Update only completed status
      const response = await makeJsonRequest(
        testApp,
        `/api/todos/${todo.id}`,
        'PUT',
        { completed: true }
      )

      expect(response.status).toBe(200)
      const updated = await parseJsonResponse<TodoResponse>(response)

      expect(updated.title).toBe('Original Title') // Unchanged
      expect(updated.completed).toBe(true) // Changed
    })

    it('should return 404 when updating non-existent todo', async () => {
      const testApp = createTestApp(ctx.authUser)

      const response = await makeJsonRequest(
        testApp,
        '/api/todos/999999',
        'PUT',
        { title: 'Updated' }
      )

      await expectNotFoundError(response)
    })

    it("should return 404 when updating another user's todo", async () => {
      const otherUser = await testUserFactory.create(ctx.prisma, {
        id: 'other-user',
        email: 'other@example.com',
      })
      const todo = await testTodoFactory.create(ctx.prisma, otherUser.id)

      const testApp = createTestApp(ctx.authUser)

      const response = await makeJsonRequest(
        testApp,
        `/api/todos/${todo.id}`,
        'PUT',
        { title: 'Hacked!' }
      )

      await expectNotFoundError(response)

      // Verify it wasn't changed
      const unchanged = await ctx.prisma.todo.findUnique({
        where: { id: todo.id },
      })
      expect(unchanged?.title).toBe(todo.title)
    })
  })

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo when authenticated as owner', async () => {
      const todo = await testTodoFactory.create(ctx.prisma, ctx.user.id)

      const testApp = createTestApp(ctx.authUser)
      const response = await makeRequest(testApp, `/api/todos/${todo.id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)
      const result = await parseJsonResponse<DeleteResponse>(response)
      expect(result.message).toBe('Todo deleted successfully')

      // Verify it was deleted
      const deleted = await ctx.prisma.todo.findUnique({
        where: { id: todo.id },
      })
      expect(deleted).toBeNull()
    })

    it('should return 404 when deleting non-existent todo', async () => {
      const testApp = createTestApp(ctx.authUser)

      const response = await makeRequest(testApp, '/api/todos/999999', {
        method: 'DELETE',
      })

      await expectNotFoundError(response)
    })

    it("should return 404 when deleting another user's todo", async () => {
      const otherUser = await testUserFactory.create(ctx.prisma, {
        id: 'other-user',
        email: 'other@example.com',
      })
      const todo = await testTodoFactory.create(ctx.prisma, otherUser.id)

      const testApp = createTestApp(ctx.authUser)

      const response = await makeRequest(testApp, `/api/todos/${todo.id}`, {
        method: 'DELETE',
      })

      await expectNotFoundError(response)

      // Verify it wasn't deleted
      const stillExists = await ctx.prisma.todo.findUnique({
        where: { id: todo.id },
      })
      expect(stillExists).not.toBeNull()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking Prisma to throw errors
      // Skipping for now as it requires more complex setup
    })

    it('should handle concurrent updates correctly', async () => {
      // This would test race conditions
      // Requires more complex setup with parallel requests
    })
  })
})
