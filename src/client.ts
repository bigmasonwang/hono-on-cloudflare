/**
 * Pre-compiled RPC client types for better IDE performance
 * This file should be compiled with tsc to calculate types at build time
 */

import { hc } from 'hono/client'
import type { AppType } from '@/index'

// Pre-compile RPC types at build time for better IDE performance
// This trick calculates the type when compiling rather than at runtime
const client = hc<AppType>('')
export type Client = typeof client

/**
 * Type-safe client factory with pre-compiled types
 * Use this instead of directly calling hc<AppType>() for better performance
 */
export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args)

/**
 * Example usage:
 *
 * import { hcWithType } from '@/client'
 *
 * const client = hcWithType('http://localhost:8787/')
 * const todos = await client.api.todos.$get()
 * const newTodo = await client.api.todos.$post({
 *   json: { title: 'Learn Hono RPC' }
 * })
 */
