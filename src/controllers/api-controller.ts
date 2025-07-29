import { Hono } from 'hono'
import { PrismaClient } from '@/generated/prisma'
import todoController from '@/controllers/todo-controller'
import { createClient } from '@/lib/db'
import type { AuthUser, AuthSession } from '@/lib/auth-types'
import { createAuth } from '@/lib/auth'

type Variables = {
  prisma: PrismaClient
  user: AuthUser
  session: AuthSession
}
type Contexts = {
  Bindings: CloudflareBindings
  Variables: Variables
}

const apiController = new Hono<Contexts>()
  .use('*', async (c, next) => {
    const prisma = createClient(c.env)
    c.set('prisma', prisma)
    await next()
  })
  .use('*', async (c, next) => {
    const session = await createAuth(c.env).api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session || !session.user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    c.set('user', session.user)
    c.set('session', session.session)
    return next()
  })
  .get('/', (c) => {
    return c.text('ok')
  })
  .route('/todos', todoController)

export default apiController

export { Contexts }
