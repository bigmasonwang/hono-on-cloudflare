import type { Context, Next } from 'hono'
import { createAuth } from '@/lib/auth'
import type { Contexts } from '@/factories/api-controller-factory'

/**
 * Auth middleware that validates user session using Better Auth
 * Adds user and session to context if authenticated
 */
export const authMiddleware = async (c: Context<Contexts>, next: Next) => {
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session || !session.user) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)
  return next()
}

/**
 * Optional auth middleware that adds user/session to context if present
 * Continues to next middleware even if not authenticated
 */
export const optionalAuthMiddleware = async (
  c: Context<Contexts>,
  next: Next
) => {
  try {
    const session = await createAuth(c.env).api.getSession({
      headers: c.req.raw.headers,
    })

    if (session?.user) {
      c.set('user', session.user)
      c.set('session', session.session)
    }
  } catch (error) {
    // Continue without auth if session check fails
    console.warn('Optional auth middleware failed:', error)
  }

  return next()
}
