import { createAuth } from './lib/auth'
import todos from './routes/todos'
import chat from './routes/chat'

import { factoryWithMiddleware } from './factories/app-factory'

const app = factoryWithMiddleware
  .createApp()
  .route('/api/todos', todos)
  .route('/api/chat', chat)

app.on(['GET', 'POST'], '/api/*', async (c) => {
  try {
    const auth = createAuth(c.env)
    return auth.handler(c.req.raw)
  } catch (error) {
    console.error('Auth handler error:', error)
    return c.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
export type AppType = typeof app
