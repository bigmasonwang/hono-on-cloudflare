import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Bot } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ChatContent } from '@/components/ChatContent'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

function ChatPage() {
  const { data: session, isPending } = authClient.useSession()

  // Redirect to login if not authenticated
  if (!isPending && !session?.user) {
    return <Navigate to="/login" />
  }

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Card className="h-[80vh] flex flex-col">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only render the chat content when authenticated
  return <ChatContent session={session} />
}
