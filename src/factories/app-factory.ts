import { createFactory } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { PrismaClient } from '@/generated/prisma'
import type { AuthUser, AuthSession } from '@/lib/auth-types'
import { prismaMiddleware } from '@/middleware/prisma'
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

export const factory = createFactory<Contexts>()

export const factoryWithMiddleware = createFactory<Contexts>({
  initApp: (app) => {
    // Global error handler
    app.onError((err, c) => {
      // Enhanced logging with request context
      console.error('Global error:', {
        error: err.message,
        stack: err.stack,
        method: c.req.method,
        url: c.req.url,
        userAgent: c.req.header('user-agent'),
        timestamp: new Date().toISOString(),
      })

      if (err instanceof HTTPException) {
        // Log HTTP exceptions with their status
        console.error(`HTTP ${err.status}:`, err.message)
        return err.getResponse()
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: err.message,
          timestamp: new Date().toISOString(),
        },
        500
      )
    })

    app.use('/api/*', prismaMiddleware).use('/api/*', authMiddleware)
  },
})

export type { Contexts }
