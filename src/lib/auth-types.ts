import { betterAuth } from 'better-auth'
import type { KyselyClient } from '@/lib/kysely'

// Create a dummy auth instance just for type inference
// This won't be executed at runtime, it's just for TypeScript
declare const dummyDb: KyselyClient
const authTypeHelper = betterAuth({
  database: dummyDb,
  emailAndPassword: {
    enabled: true,
  },
})

// Extract the types
export type AuthUser = typeof authTypeHelper.$Infer.Session.user
export type AuthSession = typeof authTypeHelper.$Infer.Session.session
