import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { type Contexts } from '@/factories/app-factory'
import type { TodoUpdate, Todo } from '@/lib/database-types'

// Helper function to convert SQLite boolean values to JavaScript booleans
const normalizeTodo = (todo: Todo): Todo => ({
  ...todo,
  completed: Boolean(todo.completed),
})

const todos = new Hono<Contexts>()
  .get('/', async (c) => {
    const db = c.get('db')
    const user = c.get('user')

    try {
      const todos = await db
        .selectFrom('Todo')
        .selectAll()
        .where('userId', '=', user.id)
        .orderBy('createdAt', 'desc')
        .execute()
      return c.json(todos.map(normalizeTodo))
    } catch (error) {
      return c.json({ error: 'Failed to fetch todos' }, 500)
    }
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1, 'Title is required'),
      })
    ),
    async (c) => {
      const db = c.get('db')
      const user = c.get('user')

      try {
        const { title } = c.req.valid('json')

        const result = await db
          .insertInto('Todo')
          .values({
            title,
            userId: user.id,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        return c.json(normalizeTodo(result), 201)
      } catch (error) {
        return c.json({ error: 'Failed to create todo' }, 500)
      }
    }
  )
  .get('/:id', async (c) => {
    const db = c.get('db')
    const user = c.get('user')

    try {
      const id = parseInt(c.req.param('id'))
      const todo = await db
        .selectFrom('Todo')
        .selectAll()
        .where('id', '=', id)
        .where('userId', '=', user.id)
        .executeTakeFirst()

      if (!todo) {
        return c.json({ error: 'Todo not found' }, 404)
      }

      return c.json(normalizeTodo(todo))
    } catch (error) {
      return c.json({ error: 'Failed to fetch todo' }, 500)
    }
  })
  .put(
    '/:id',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1).optional(),
        completed: z.boolean().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db')
      const user = c.get('user')

      try {
        const id = parseInt(c.req.param('id'))
        const { title, completed } = c.req.valid('json')

        const updateData: TodoUpdate = { updatedAt: new Date().toISOString() }
        if (title !== undefined) updateData.title = title
        if (completed !== undefined) updateData.completed = completed

        const todo = await db
          .updateTable('Todo')
          .set(updateData)
          .where('id', '=', id)
          .where('userId', '=', user.id)
          .returningAll()
          .executeTakeFirst()

        if (!todo) {
          return c.json({ error: 'Todo not found' }, 404)
        }

        return c.json(normalizeTodo(todo))
      } catch (error) {
        return c.json({ error: 'Todo not found' }, 404)
      }
    }
  )
  .delete('/:id', async (c) => {
    const db = c.get('db')
    const user = c.get('user')

    try {
      const id = parseInt(c.req.param('id'))

      // First check if the todo exists and belongs to the user
      const todo = await db
        .selectFrom('Todo')
        .select('id')
        .where('id', '=', id)
        .where('userId', '=', user.id)
        .executeTakeFirst()

      if (!todo) {
        return c.json({ error: 'Todo not found' }, 404)
      }

      // If it exists, delete it
      await db
        .deleteFrom('Todo')
        .where('id', '=', id)
        .where('userId', '=', user.id)
        .execute()

      return c.json({ message: 'Todo deleted successfully' })
    } catch (error) {
      return c.json({ error: 'Todo not found' }, 404)
    }
  })

export default todos
