import { createClient } from '@/lib/db'
import type { AuthUser, AuthSession } from '@/lib/auth-types'
import { factory } from '@/factories/app-factory'
import todos from '@/routes/todos'

// Test helper to create mock auth middleware
const createMockAuthMiddleware = (authUser: AuthUser | null) => {
  return async (c: any, next: any) => {
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
  }
}

// Test helper to create Prisma setup with proper cleanup
const createTestPrismaSetup = () => {
  return async (c: any, next: any) => {
    const prisma = createClient(c.env)
    c.set('prisma', prisma)

    try {
      await next()
    } finally {
      // Ensure cleanup after each request
      await prisma.$disconnect()
    }
  }
}

// Create a test version of the API controller using the factory

export const createTestApp = (authUser: AuthUser | null = null) => {
  const app = factory
    .createApp()
    .use('/api/*', createMockAuthMiddleware(authUser))
    .use('/api/*', createTestPrismaSetup())
    .route('/api/todos', todos)

  return app
}
