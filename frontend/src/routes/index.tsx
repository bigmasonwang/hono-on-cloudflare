import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { TodoList } from '@/components/TodoList'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data } = authClient.useSession()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Todo App</h1>
        {data?.user ? (
          <p className="text-muted-foreground">
            Welcome back, {data.user.name}!
          </p>
        ) : (
          <p className="text-muted-foreground">Please sign in to get started</p>
        )}
      </div>

      <TodoList />
    </div>
  )
}
