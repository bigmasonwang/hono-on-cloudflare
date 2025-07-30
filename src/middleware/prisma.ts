import { type Context, type Next } from 'hono'
import { createClient } from '@/lib/db'
import type { Contexts } from '@/factories/app-factory'

export const prismaMiddleware = async (c: Context<Contexts>, next: Next) => {
  const prisma = createClient(c.env)
  c.set('prisma', prisma)
  return next()
}
