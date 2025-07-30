import { Hono } from 'hono'
import { PrismaClient } from '@/generated/prisma'
import todoController from '@/controllers/todo-controller'
import { createClient } from '@/lib/db'
import type { AuthUser, AuthSession } from '@/lib/auth-types'
import { authMiddleware } from '@/middleware/auth'

type Variables = {
  prisma: PrismaClient
  user: AuthUser
  session: AuthSession
}

type Contexts = {
  Bindings: CloudflareBindings
  Variables: Variables
}

export interface ApiControllerOptions {
  // For testing: inject custom auth middleware
  authMiddleware?: (c: any, next: any) => Promise<Response | void>
  // For testing: inject custom prisma setup
  prismaSetup?: (c: any, next: any) => Promise<void>
}

export type { Contexts }

export function createApiController(options: ApiControllerOptions = {}) {
  const apiController = new Hono<Contexts>()
    .use('*', async (c, next) => {
      if (options.prismaSetup) {
        await options.prismaSetup(c, next)
      } else {
        const prisma = createClient(c.env)
        c.set('prisma', prisma)
        await next()
      }
    })

    // Public routes (no auth required)
    .get('/health', (c) => {
      return c.text('ok')
    })

    // Protected routes (auth required)
    .use('/todos/*', options.authMiddleware || authMiddleware)
    .route('/todos', todoController)

  return apiController
}

// Export the default production version
export default createApiController()
