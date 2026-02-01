// Client exports (browser only)
export {getSupabaseClient} from './client'

// Enum constants for runtime use
export {CreditRole, GameStatus, PageVisibility, StudioRole} from './enums'

export type {CreditRoleType, GameStatusType, PageVisibilityType, StudioRoleType} from './enums'

export type {Database, Enums, Tables, TablesInsert, TablesUpdate} from './types'
// Runtime constants (enums as arrays)
export {Constants} from './types'

// Re-export Supabase types for consumers
export type {User} from '@supabase/supabase-js'
