import { betterAuth } from 'better-auth'
import { createKyselyClient } from '@/lib/kysely'

export const createAuth = (env: CloudflareBindings) => {
  const db = createKyselyClient(env.DATABASE)

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    database: { db },
    emailAndPassword: {
      enabled: true,
    },
    ...(env.ENVIRONMENT === 'development' && {
      trustedOrigins: ['http://localhost:3000'],
    }),
  })
}
