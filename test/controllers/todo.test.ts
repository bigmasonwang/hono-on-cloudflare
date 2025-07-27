import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import app from '../../src/index'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaD1 } from '@prisma/adapter-d1'

describe('Hello Hono root route', () => {
  it('should return "Hello Hono!" on GET /', async () => {
    const response = await app.request('/')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hello Hono!')
  })
})

describe('Todo API', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    const adapter = new PrismaD1(env.DATABASE)
    const prisma = new PrismaClient({ adapter })
    await prisma.todo.deleteMany({})
  })

  describe('GET /api/todos', () => {
    it('should return an empty array when no todos exist', async () => {
      const response = await app.request('/api/todos', {}, env)
      expect(response.status).toBe(200)
      const todos = (await response.json()) as any[]
      expect(todos).toEqual([])
    })

    it('should return all todos', async () => {
      // Create some test todos
      const adapter = new PrismaD1(env.DATABASE)
      const prisma = new PrismaClient({ adapter })

      await prisma.todo.create({ data: { title: 'Test Todo 1' } })
      await prisma.todo.create({ data: { title: 'Test Todo 2' } })

      const response = await app.request('/api/todos', {}, env)
      expect(response.status).toBe(200)
      const todos = (await response.json()) as any[]
      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Test Todo 2') // Latest first
      expect(todos[1].title).toBe('Test Todo 1')
    })
  })

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const response = await app.request(
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
    })

    it('should return 400 when title is missing', async () => {
      const response = await app.request(
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
      expect(error.error).toBe('Title is required')
    })
  })

  describe('GET /api/todos/:id', () => {
    it('should return a specific todo', async () => {
      const adapter = new PrismaD1(env.DATABASE)
      const prisma = new PrismaClient({ adapter })
      const created = await prisma.todo.create({ data: { title: 'Test Todo' } })

      const response = await app.request(`/api/todos/${created.id}`, {}, env)
      expect(response.status).toBe(200)
      const todo = (await response.json()) as any
      expect(todo.id).toBe(created.id)
      expect(todo.title).toBe('Test Todo')
    })

    it('should return 404 when todo not found', async () => {
      const response = await app.request('/api/todos/999', {}, env)
      expect(response.status).toBe(404)
      const error = (await response.json()) as any
      expect(error.error).toBe('Todo not found')
    })
  })

  describe('PUT /api/todos/:id', () => {
    it('should update a todo', async () => {
      const adapter = new PrismaD1(env.DATABASE)
      const prisma = new PrismaClient({ adapter })
      const created = await prisma.todo.create({
        data: { title: 'Original Title' },
      })

      const response = await app.request(
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
      const adapter = new PrismaD1(env.DATABASE)
      const prisma = new PrismaClient({ adapter })
      const created = await prisma.todo.create({
        data: { title: 'Original Title' },
      })

      const response = await app.request(
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
  })

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo', async () => {
      const adapter = new PrismaD1(env.DATABASE)
      const prisma = new PrismaClient({ adapter })
      const created = await prisma.todo.create({ data: { title: 'To Delete' } })

      const response = await app.request(
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
  })
})
