import { Hono } from 'hono'
import { PrismaClient } from '../generated/prisma'
import todoController from './todo-controller'
import { PrismaD1 } from '@prisma/adapter-d1'

type Variables = {
  prisma: PrismaClient
}
type Contexts = {
  Bindings: CloudflareBindings
  Variables: Variables
}

const apiController = new Hono<Contexts>()
  .use('*', async (c, next) => {
    const adapter = new PrismaD1(c.env.DATABASE)
    const prisma = new PrismaClient({ adapter })
    c.set('prisma', prisma)
    await next()
  })
  .get('/', (c) => {
    return c.text('ok')
  })
  .route('/todos', todoController)

export default apiController

export { Contexts }
