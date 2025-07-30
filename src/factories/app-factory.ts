import { createFactory } from 'hono/factory'
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
    app.use('/api/*', prismaMiddleware).use('/api/*', authMiddleware)
  },
})

export type { Contexts }
