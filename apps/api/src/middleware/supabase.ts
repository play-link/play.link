import {createClient} from '@supabase/supabase-js'
import type {Context, Next} from 'hono'
import type {AppContext} from '../types'

/**
 * Middleware: Creates Supabase admin client and attaches to context
 */
export async function supabaseMiddleware(c: Context<AppContext>, next: Next) {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  c.set('supabase', supabase)
  await next()
}
