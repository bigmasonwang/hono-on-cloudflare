import { createAuth } from './lib/auth'
import todos from './routes/todos'

import { factoryWithMiddleware } from './factories/app-factory'

const app = factoryWithMiddleware.createApp().route('/api/todos', todos)

app.on(['GET', 'POST'], '/api/*', (c) => {
  return createAuth(c.env).handler(c.req.raw)
})

export default app
export type AppType = typeof app
