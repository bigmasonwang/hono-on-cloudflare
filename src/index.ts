import { createAuth } from './lib/auth'
import todos from './routes/todos'
import chat from './routes/chat'

import { factoryWithMiddleware } from './factories/app-factory'

const app = factoryWithMiddleware
  .createApp()
  .route('/api/todos', todos)
  .route('/api/chat', chat)

app.on(['GET', 'POST'], '/api/*', (c) => {
  return createAuth(c.env).handler(c.req.raw)
})

export default app
export type AppType = typeof app
