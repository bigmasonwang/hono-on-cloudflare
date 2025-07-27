import { Hono } from 'hono'
import { logger } from 'hono/logger'
import apiController from '@/controllers/api-controller'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app
  .use(logger())
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })
  .route('/api', apiController)

export default app
