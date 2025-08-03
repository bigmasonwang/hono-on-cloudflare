import type { Todo, User } from '@/lib/database-types'
import type { AuthUser } from '@/lib/auth-types'
import type { KyselyClient } from '@/lib/kysely'

// Response types for your API
export interface TodoResponse extends Todo {}

export interface TodoListResponse extends Array<Todo> {}

export interface ErrorResponse {
  error: string
}

export interface ValidationErrorResponse {
  success: false
  error: {
    issues: Array<{
      path: string[]
      message: string
    }>
  }
}

export interface DeleteResponse {
  message: string
}

// Test context types
export interface TestContext {
  user: User
  authUser: AuthUser
  db: KyselyClient
}
