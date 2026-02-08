/**
 * Server-side exports (no browser-specific code)
 * Use this in API/backend projects
 */
import {createClient} from '@supabase/supabase-js'
import type {Database} from './types'

/**
 * Create admin client for server-side (bypasses RLS).
 * Uses service role key - NEVER expose in browser.
 */
export function createAdminClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Enum constants
export {CreditRole, DomainStatus, DomainTargetType, GameStatus, StudioRole} from './enums'

export type {
  CreditRoleType,
  DomainStatusType,
  DomainTargetTypeType,
  GameStatusType,
  StudioRoleType,
} from './enums'

// Type exports
export type {Database, Enums, Tables, TablesInsert, TablesUpdate} from './types'
