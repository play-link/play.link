/**
 * @play/api-types
 *
 * API Contract - Maps endpoints to their request/response types.
 * Types are derived from the database schema via @play/supabase-client.
 *
 * This package is shared between:
 * - apps/api (validation)
 * - apps/studio (typed hooks)
 */
import type {Enums, Tables, TablesInsert} from '@play/supabase-client'

// =============================================================================
// Entity Types (derived from database)
// =============================================================================

/** Organization with optional membership role */
export type Organization = Tables<'organizations'> & {
  role?: Enums<'org_role'>
}

export type Profile = Tables<'profiles'>
export type Game = Tables<'games'>
export type GameCredit = Tables<'game_credits'>
export type OrganizationMember = Tables<'organization_members'>

// =============================================================================
// Input Types (for mutations)
// =============================================================================

export type CreateOrganizationInput = Pick<
  TablesInsert<'organizations'>,
  'slug' | 'name'
>

export type UpdateOrganizationInput = Partial<
  Pick<TablesInsert<'organizations'>, 'slug' | 'name'>
>

// =============================================================================
// HTTP Methods
// =============================================================================

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const
export type HttpMethodType = (typeof HttpMethod)[keyof typeof HttpMethod]

// =============================================================================
// API Route Constants
// =============================================================================

export const ApiRoute = {
  ORGANIZATIONS: '/organizations',
  ORGANIZATIONS_BY_ID: '/organizations/:id',
  ME: '/me',
  HEALTH: '/health',
} as const

// =============================================================================
// API Routes Contract
// =============================================================================

/**
 * Maps each endpoint to its method-specific request/response types.
 * This is the single source of truth for API types.
 */
export interface ApiRoutes {
  '/organizations': {
    GET: {response: Organization[]}
    POST: {body: CreateOrganizationInput; response: Organization}
  }
  '/organizations/:id': {
    PATCH: {body: UpdateOrganizationInput; response: Organization}
    DELETE: {body: {id: string}; response: {success: boolean}}
  }
  '/me': {
    GET: {response: {id: string; email: string}}
  }
  '/health': {
    GET: {response: {status: string}}
  }
}

// =============================================================================
// Type Utilities
// =============================================================================

/** All defined API endpoints */
export type ApiEndpoint = keyof ApiRoutes

/** Endpoints that support a specific HTTP method */
export type EndpointsWith<M extends string> = {
  [E in ApiEndpoint]: M extends keyof ApiRoutes[E] ? E : never
}[ApiEndpoint]

/** HTTP methods available for an endpoint */
export type ApiMethod<E extends ApiEndpoint> = keyof ApiRoutes[E]

/** Response type for a specific endpoint and method */
export type ApiResponse<
  E extends ApiEndpoint,
  M extends string,
> = M extends keyof ApiRoutes[E]
  ? ApiRoutes[E][M] extends {response: infer R}
    ? R
    : never
  : never

/** Request body type for a specific endpoint and method */
export type ApiBody<
  E extends ApiEndpoint,
  M extends string,
> = M extends keyof ApiRoutes[E]
  ? ApiRoutes[E][M] extends {body: infer B}
    ? B
    : never
  : never
