import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@/generated/prisma'

export const createClient = (env: CloudflareBindings) => {
  const adapter = new PrismaD1(env.DATABASE)
  const prisma = new PrismaClient({ adapter })

  return prisma
}
