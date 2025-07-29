import { Hono } from 'hono'
import { PrismaClient } from '@/generated/prisma'
import todoController from '@/controllers/todo-controller'
import { createClient } from '@/lib/db'
import type { AuthUser, AuthSession } from '@/lib/auth-types'

type Variables = {
  prisma: PrismaClient
  user: AuthUser
  session: AuthSession
}

type Contexts = {
  Bindings: CloudflareBindings
  Variables: Variables
}

// Create a test version of the API controller that allows us to inject auth
export const createTestApiController = (authUser: AuthUser | null) => {
  const testApiController = new Hono<Contexts>()
    .use('*', async (c, next) => {
      const prisma = createClient(c.env)
      c.set('prisma', prisma)
      await next()
    })
    .use('*', async (c, next) => {
      // Mock auth middleware
      if (!authUser) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      c.set('user', authUser)
      c.set('session', {
        id: 'test-session',
        userId: authUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
        token: 'test-token',
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      } as AuthSession)

      return next()
    })
    .get('/', (c) => {
      return c.text('ok')
    })
    .route('/todos', todoController)

  return testApiController
}

export const createTestApp = (authUser: AuthUser | null = null) => {
  const app = new Hono<{
    Bindings: CloudflareBindings
  }>()

  const testApiController = createTestApiController(authUser)
  app.route('/api', testApiController)

  return app
}
