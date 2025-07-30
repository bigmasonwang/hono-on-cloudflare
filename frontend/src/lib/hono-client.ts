import { hc } from 'hono/client'
import type { InferResponseType } from 'hono/client'
import type { AppType } from '@api/index'

export const honoClient = hc<AppType>('/')

// Infer Todo type from the API response
type GetTodosResponse = InferResponseType<typeof honoClient.api.todos.$get>
export type Todo = Extract<GetTodosResponse, readonly unknown[]>[number]
