import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { PrismaClient, User } from '@/generated/prisma'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { AuthUser } from '@/lib/auth-types'
import { createTestApp } from '../test-app'

// Import the main app for the hello route test
import app from '@/index'

describe('Hello Hono root route', () => {
  it('should return "Hello Hono!" on GET /', async () => {
    const response = await app.request('/', {}, env)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hello Hono!')
  })
})

describe('Todo API', () => {
  let testUser: User
  let prisma: PrismaClient

  // Helper function to create a test user
  const createTestUser = async (prisma: PrismaClient): Promise<User> => {
    return await prisma.user.create({
      data: {
        id: 'test-user-' + Date.now(),
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  beforeEach(async () => {
    // Initialize Prisma client
    const adapter = new PrismaD1(env.DATABASE)
    prisma = new PrismaClient({ adapter })

    // Clean up the database before each test
    await prisma.todo.deleteMany({})
    await prisma.user.deleteMany({})

    // Create a test user for todo operations
    testUser = await createTestUser(prisma)
  })

  describe('GET /api/todos', () => {
    it('should return an empty array when no todos exist', async () => {
      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request('/api/todos', {}, env)
      expect(response.status).toBe(200)
      const todos = (await response.json()) as any[]
      expect(todos).toEqual([])
    })

    it('should return only authenticated user todos', async () => {
      // Create some test todos
      await prisma.todo.create({
        data: { title: 'Test Todo 1', userId: testUser.id },
      })
      await prisma.todo.create({
        data: { title: 'Test Todo 2', userId: testUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request('/api/todos', {}, env)
      expect(response.status).toBe(200)
      const todos = (await response.json()) as any[]
      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Test Todo 2') // Latest first
      expect(todos[1].title).toBe('Test Todo 1')
    })

    it('should only return todos for the authenticated user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-' + Date.now(),
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Create todos for both users
      await prisma.todo.create({
        data: { title: 'My Todo', userId: testUser.id },
      })
      await prisma.todo.create({
        data: { title: 'Other User Todo', userId: otherUser.id },
      })

      // With auth, should only return the authenticated user's todos
      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request('/api/todos', {}, env)
      expect(response.status).toBe(200)
      const todos = (await response.json()) as any[]

      // Should only return authenticated user's todos
      expect(todos).toHaveLength(1)
      expect(todos[0].title).toBe('My Todo')
      expect(todos[0].userId).toBe(testUser.id)
    })

    it('should return 401 when not authenticated', async () => {
      // Request without authentication
      const testApp = createTestApp(null)
      const response = await testApp.request('/api/todos', {}, env)
      expect(response.status).toBe(401)
      const error = (await response.json()) as any
      expect(error.error).toBe('Authentication required')
    })
  })

  describe('POST /api/todos', () => {
    it('should create a new todo when authenticated', async () => {
      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        '/api/todos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Todo' }),
        },
        env
      )

      expect(response.status).toBe(201)
      const todo = (await response.json()) as any
      expect(todo.title).toBe('New Todo')
      expect(todo.completed).toBe(false)
      expect(todo.id).toBeDefined()
      expect(todo.userId).toBe(testUser.id)
    })

    it('should return 401 when not authenticated', async () => {
      const testApp = createTestApp(null)
      const response = await testApp.request(
        '/api/todos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Todo' }),
        },
        env
      )

      expect(response.status).toBe(401)
      const error = (await response.json()) as any
      expect(error.error).toBe('Authentication required')
    })

    it('should return 400 when title is missing', async () => {
      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        '/api/todos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        env
      )

      expect(response.status).toBe(400)
      const error = (await response.json()) as any
      // Zod validator returns validation errors in success: false, error format
      expect(error.success).toBe(false)
      expect(error.error).toBeDefined()
    })
  })

  describe('GET /api/todos/:id', () => {
    it('should return a specific todo when authenticated as owner', async () => {
      const created = await prisma.todo.create({
        data: { title: 'Test Todo', userId: testUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {},
        env
      )
      expect(response.status).toBe(200)
      const todo = (await response.json()) as any
      expect(todo.id).toBe(created.id)
      expect(todo.title).toBe('Test Todo')
    })

    it('should return 404 when todo belongs to another user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-' + Date.now(),
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const created = await prisma.todo.create({
        data: { title: 'Other User Todo', userId: otherUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {},
        env
      )
      expect(response.status).toBe(404)
      const error = (await response.json()) as any
      expect(error.error).toBe('Todo not found')
    })

    it('should return 404 when todo not found', async () => {
      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request('/api/todos/999', {}, env)
      expect(response.status).toBe(404)
      const error = (await response.json()) as any
      expect(error.error).toBe('Todo not found')
    })

    it('should return 401 when not authenticated', async () => {
      const created = await prisma.todo.create({
        data: { title: 'Test Todo', userId: testUser.id },
      })

      const testApp = createTestApp(null)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {},
        env
      )
      expect(response.status).toBe(401)
      const error = (await response.json()) as any
      expect(error.error).toBe('Authentication required')
    })
  })

  describe('PUT /api/todos/:id', () => {
    it('should update a todo when authenticated as owner', async () => {
      const created = await prisma.todo.create({
        data: { title: 'Original Title', userId: testUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Title', completed: true }),
        },
        env
      )

      expect(response.status).toBe(200)
      const todo = (await response.json()) as any
      expect(todo.title).toBe('Updated Title')
      expect(todo.completed).toBe(true)
    })

    it('should update only provided fields', async () => {
      const created = await prisma.todo.create({
        data: { title: 'Original Title', userId: testUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        },
        env
      )

      expect(response.status).toBe(200)
      const todo = (await response.json()) as any
      expect(todo.title).toBe('Original Title')
      expect(todo.completed).toBe(true)
    })

    it('should return 401 when not authenticated', async () => {
      const created = await prisma.todo.create({
        data: { title: 'Original Title', userId: testUser.id },
      })

      const testApp = createTestApp(null)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Title' }),
        },
        env
      )

      expect(response.status).toBe(401)
      const error = (await response.json()) as any
      expect(error.error).toBe('Authentication required')
    })

    it("should return 404 when trying to update another user's todo", async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-' + Date.now(),
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const created = await prisma.todo.create({
        data: { title: 'Other User Todo', userId: otherUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Title' }),
        },
        env
      )

      expect(response.status).toBe(404)
      const error = (await response.json()) as any
      expect(error.error).toBe('Todo not found')
    })
  })

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo when authenticated as owner', async () => {
      const created = await prisma.todo.create({
        data: { title: 'To Delete', userId: testUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'DELETE',
        },
        env
      )

      expect(response.status).toBe(200)
      const result = (await response.json()) as any
      expect(result.message).toBe('Todo deleted successfully')

      // Verify it was deleted
      const deleted = await prisma.todo.findUnique({
        where: { id: created.id },
      })
      expect(deleted).toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
      const created = await prisma.todo.create({
        data: { title: 'To Delete', userId: testUser.id },
      })

      const testApp = createTestApp(null)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'DELETE',
        },
        env
      )

      expect(response.status).toBe(401)
      const error = (await response.json()) as any
      expect(error.error).toBe('Authentication required')

      // Verify it was NOT deleted
      const stillExists = await prisma.todo.findUnique({
        where: { id: created.id },
      })
      expect(stillExists).not.toBeNull()
    })

    it("should return 404 when trying to delete another user's todo", async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          id: 'other-user-' + Date.now(),
          name: 'Other User',
          email: `other-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const created = await prisma.todo.create({
        data: { title: 'Other User Todo', userId: otherUser.id },
      })

      const testApp = createTestApp(testUser as AuthUser)
      const response = await testApp.request(
        `/api/todos/${created.id}`,
        {
          method: 'DELETE',
        },
        env
      )

      expect(response.status).toBe(404)
      const error = (await response.json()) as any
      expect(error.error).toBe('Todo not found')

      // Verify it was NOT deleted
      const stillExists = await prisma.todo.findUnique({
        where: { id: created.id },
      })
      expect(stillExists).not.toBeNull()
    })
  })
})
