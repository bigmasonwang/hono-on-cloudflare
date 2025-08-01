import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // baseURL: process.env.BETTER_AUTH_URL!
  basePath: '/api/auth',
})

export const { signIn, signUp, signOut, useSession } = authClient
