import { Hono } from 'hono'
import { PrismaClient } from './generated/prisma'
import { PrismaD1 } from '@prisma/adapter-d1'

type Variables = {
  prisma: PrismaClient
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>()

// Prisma middleware - only for API routes
app.use('/api/*', async (c, next) => {
  const adapter = new PrismaD1(c.env.DATABASE)
  const prisma = new PrismaClient({ adapter })
  c.set('prisma', prisma)
  await next()
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Get all todos
app.get('/api/todos', async (c) => {
  const prisma = c.get('prisma')

  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return c.json(todos)
  } catch (error) {
    return c.json({ error: 'Failed to fetch todos' }, 500)
  }
})

// Create a new todo
app.post('/api/todos', async (c) => {
  const prisma = c.get('prisma')

  try {
    const { title } = await c.req.json()

    if (!title) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const todo = await prisma.todo.create({
      data: { title },
    })
    return c.json(todo, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create todo' }, 500)
  }
})

// Get a single todo
app.get('/api/todos/:id', async (c) => {
  const prisma = c.get('prisma')

  try {
    const id = parseInt(c.req.param('id'))
    const todo = await prisma.todo.findUnique({
      where: { id },
    })

    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404)
    }

    return c.json(todo)
  } catch (error) {
    return c.json({ error: 'Failed to fetch todo' }, 500)
  }
})

// Update a todo
app.put('/api/todos/:id', async (c) => {
  const prisma = c.get('prisma')

  try {
    const id = parseInt(c.req.param('id'))
    const { title, completed } = await c.req.json()

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
      },
    })

    return c.json(todo)
  } catch (error) {
    return c.json({ error: 'Failed to update todo' }, 500)
  }
})

// Delete a todo
app.delete('/api/todos/:id', async (c) => {
  const prisma = c.get('prisma')

  try {
    const id = parseInt(c.req.param('id'))
    await prisma.todo.delete({
      where: { id },
    })

    return c.json({ message: 'Todo deleted successfully' })
  } catch (error) {
    return c.json({ error: 'Failed to delete todo' }, 500)
  }
})

export default app
