import type { Todo, User } from '@/generated/prisma'

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
  prisma: PrismaClient
}

// Import necessary types
import type { AuthUser } from '@/lib/auth-types'
import type { PrismaClient } from '@/generated/prisma'
