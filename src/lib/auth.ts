import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { createClient } from '@/lib/db'

export const createAuth = (env: CloudflareBindings) => {
  const prisma = createClient(env)

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
      provider: 'sqlite',
    }),
    emailAndPassword: {
      enabled: true,
    },
  })
}

// This is used for CLI schema generation
// import { PrismaClient } from '@/generated/prisma'

// const prisma = new PrismaClient()
// export const auth = betterAuth({
//   database: prismaAdapter(prisma, {
//     provider: 'sqlite',
//   }),
// })
