import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { honoClient, type Todo } from '@/lib/hono-client'
import { authClient } from '@/lib/auth-client'

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = authClient.useSession()

  const fetchTodos = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      const response = await honoClient.api.todos.$get()
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      } else {
        setError('Failed to fetch todos')
      }
    } catch (err) {
      setError('Failed to fetch todos')
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async () => {
    if (!newTodoTitle.trim() || !session?.user) return

    try {
      setLoading(true)
      const response = await honoClient.api.todos.$post({
        json: { title: newTodoTitle.trim() },
      })

      if (response.ok) {
        const newTodo = await response.json()
        setTodos((prev) => [newTodo, ...prev])
        setNewTodoTitle('')
      } else {
        setError('Failed to create todo')
      }
    } catch (err) {
      setError('Failed to create todo')
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await honoClient.api.todos[':id'].$put({
        param: { id: id.toString() },
        json: { completed: !completed },
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
        )
      } else {
        setError('Failed to update todo')
      }
    } catch (err) {
      setError('Failed to update todo')
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const response = await honoClient.api.todos[':id'].$delete({
        param: { id: id.toString() },
      })

      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id))
      } else {
        setError('Failed to delete todo')
      }
    } catch (err) {
      setError('Failed to delete todo')
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [session])

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to manage your todos
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Todos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex gap-2">
          <Input
            placeholder="Add a new todo..."
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            disabled={loading}
          />
          <Button onClick={addTodo} disabled={loading || !newTodoTitle.trim()}>
            Add
          </Button>
        </div>

        {loading && todos.length === 0 ? (
          <p className="text-center text-muted-foreground">Loading todos...</p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="h-4 w-4"
                />
                <span
                  className={`flex-1 ${
                    todo.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {todo.title}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTodo(todo.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
            {todos.length === 0 && !loading && (
              <p className="text-center text-muted-foreground">
                No todos yet. Add one above!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
