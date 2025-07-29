import { Hono } from 'hono'
import { logger } from 'hono/logger'
import apiController from '@/controllers/api-controller'
import { createAuth } from './lib/auth'
import type { AuthUser, AuthSession } from './lib/auth-types'

const app = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: AuthUser | null; session: AuthSession | null }
}>()

const routes = app
  .use(logger())
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })
  .route('/api', apiController)

app.on(['GET', 'POST'], '/api/*', (c) => {
  return createAuth(c.env).handler(c.req.raw)
})

export default app
export type AppType = typeof routes
