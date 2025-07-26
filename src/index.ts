import { Hono } from 'hono'
import apiController from './controllers/api-controller'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })
  .route('/api', apiController)

export default app
