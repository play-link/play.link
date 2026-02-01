/**
 * Enum constants for runtime use.
 * These match the PostgreSQL enums in the database.
 */

export const StudioRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const

export const GameStatus = {
  IN_DEVELOPMENT: 'IN_DEVELOPMENT',
  UPCOMING: 'UPCOMING',
  EARLY_ACCESS: 'EARLY_ACCESS',
  RELEASED: 'RELEASED',
  CANCELLED: 'CANCELLED',
} as const

export const PageVisibility = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export const CreditRole = {
  DEVELOPER: 'DEVELOPER',
  PUBLISHER: 'PUBLISHER',
  PORTING: 'PORTING',
  MARKETING: 'MARKETING',
  SUPPORT: 'SUPPORT',
} as const

// Type helpers derived from constants
export type StudioRoleType = (typeof StudioRole)[keyof typeof StudioRole]
export type GameStatusType = (typeof GameStatus)[keyof typeof GameStatus]
export type PageVisibilityType = (typeof PageVisibility)[keyof typeof PageVisibility]
export type CreditRoleType = (typeof CreditRole)[keyof typeof CreditRole]
