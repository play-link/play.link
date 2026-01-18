import {drizzle} from 'drizzle-orm/postgres-js'
import type {Context, Next} from 'hono'
import postgres from 'postgres'
import type {AppContext} from '../types'

/**
 * Middleware: Creates database connection and attaches to context
 */
export async function dbMiddleware(c: Context<AppContext>, next: Next) {
  const client = postgres(c.env.DATABASE_URL, {
    prepare: false, // Required for connection pooler
  })
  c.set('db', drizzle(client))
  await next()
}
