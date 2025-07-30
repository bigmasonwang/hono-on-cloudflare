import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data } = authClient.useSession()

  return (
    <div className="text-center">
      <h1>Home</h1>
      {data?.user ? (
        <p>Hello, {data.user.name}</p>
      ) : (
        <p>You are not signed in</p>
      )}
    </div>
  )
}
