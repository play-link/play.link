import type {SupabaseClient} from '@supabase/supabase-js'
import type {drizzle} from 'drizzle-orm/postgres-js'

// Cloudflare Workers bindings
export interface Env {
  SUPER_ADMIN_EMAIL: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  DATABASE_URL: string
  ENVIRONMENT: string
}

// Context variables
export interface Variables {
  user: {
    id: string
    email: string
  } | null
  db: ReturnType<typeof drizzle>
  supabase: SupabaseClient
}

// App context type
export type AppContext = {Bindings: Env; Variables: Variables}
