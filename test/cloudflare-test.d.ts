declare module 'cloudflare:test' {
  export const env: CloudflareBindings & {
    TEST_MIGRATIONS: D1Migration[]
    DATABASE: D1Database
  }
}
