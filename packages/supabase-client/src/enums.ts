/**
 * Enum constants for runtime use.
 * These match the PostgreSQL enums in the database.
 */

export const StudioRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const

export const GameStatus = {
  IN_DEVELOPMENT: 'IN_DEVELOPMENT',
  UPCOMING: 'UPCOMING',
  EARLY_ACCESS: 'EARLY_ACCESS',
  RELEASED: 'RELEASED',
  CANCELLED: 'CANCELLED',
} as const

export const GameType = {
  GAME: 'game',
  DLC: 'dlc',
  DEMO: 'demo',
  VIDEO: 'video',
  MOD: 'mod',
  MUSIC: 'music',
  UNKNOWN: 'unknown',
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

export const DomainTargetType = {
  STUDIO: 'studio',
  GAME: 'game',
} as const

export const DomainStatus = {
  PENDING: 'pending',
  VERIFYING: 'verifying',
  VERIFIED: 'verified',
  FAILED: 'failed',
} as const

// Type helpers derived from constants
export type StudioRoleType = (typeof StudioRole)[keyof typeof StudioRole]
export type GameStatusType = (typeof GameStatus)[keyof typeof GameStatus]
export type GameTypeType = (typeof GameType)[keyof typeof GameType]
export type PageVisibilityType = (typeof PageVisibility)[keyof typeof PageVisibility]
export type CreditRoleType = (typeof CreditRole)[keyof typeof CreditRole]
export type DomainTargetTypeType = (typeof DomainTargetType)[keyof typeof DomainTargetType]
export type DomainStatusType = (typeof DomainStatus)[keyof typeof DomainStatus]
