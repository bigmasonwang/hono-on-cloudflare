import { Hono } from 'hono'
import { PrismaClient } from '@/generated/prisma'
import todoController from '@/controllers/todo-controller'
import { createClient } from '@/lib/db'

type Variables = {
  prisma: PrismaClient
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
  .get('/', (c) => {
    return c.text('ok')
  })
  .route('/todos', todoController)

export default apiController

export { Contexts }
