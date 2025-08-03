import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely'

export interface Database {
  Todo: TodoTable
  user: UserTable
  session: SessionTable
  account: AccountTable
  verification: VerificationTable
}

export interface TodoTable {
  id: Generated<number>
  title: string
  completed: ColumnType<boolean, boolean | undefined, boolean>
  createdAt: ColumnType<string, string | undefined, never>
  updatedAt: ColumnType<string, string | undefined, string>
  userId: string
}

export interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionTable {
  id: string
  expiresAt: string
  token: string
  createdAt: string
  updatedAt: string
  ipAddress: string | null
  userAgent: string | null
  userId: string
}

export interface AccountTable {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: string | null
  refreshTokenExpiresAt: string | null
  scope: string | null
  password: string | null
  createdAt: string
  updatedAt: string
}

export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: string
  createdAt: string | null
  updatedAt: string | null
}

// Type helpers for better DX
export type Todo = Selectable<TodoTable>
export type NewTodo = Insertable<TodoTable>
export type TodoUpdate = Updateable<TodoTable>

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export type Session = Selectable<SessionTable>
export type NewSession = Insertable<SessionTable>
export type SessionUpdate = Updateable<SessionTable>

export type Account = Selectable<AccountTable>
export type NewAccount = Insertable<AccountTable>
export type AccountUpdate = Updateable<AccountTable>

export type Verification = Selectable<VerificationTable>
export type NewVerification = Insertable<VerificationTable>
export type VerificationUpdate = Updateable<VerificationTable>
