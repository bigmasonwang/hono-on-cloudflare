import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import type { PrismaClient } from '@/generated/prisma'

// Create a dummy auth instance just for type inference
// This won't be executed at runtime, it's just for TypeScript
declare const dummyPrisma: PrismaClient
const authTypeHelper = betterAuth({
  database: prismaAdapter(dummyPrisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
  },
})

// Extract the types
export type AuthUser = typeof authTypeHelper.$Infer.Session.user
export type AuthSession = typeof authTypeHelper.$Infer.Session.session
