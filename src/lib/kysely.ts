import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import type { Database } from './database-types'

export const createKyselyClient = (database: D1Database) => {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database }),
  })
}

export type KyselyClient = ReturnType<typeof createKyselyClient>
