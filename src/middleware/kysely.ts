import { type Context, type Next } from 'hono'
import { createKyselyClient } from '@/lib/kysely'
import type { Contexts } from '@/factories/app-factory'

export const kyselyMiddleware = async (c: Context<Contexts>, next: Next) => {
  const db = createKyselyClient(c.env.DATABASE)
  c.set('db', db)
  return next()
}
