/**
 * Enum constants for runtime use.
 * These match the PostgreSQL enums in the database.
 */

export const OrgRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const

export const GameStatus = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  EARLY_ACCESS: 'EARLY_ACCESS',
  RELEASED: 'RELEASED',
  CANCELLED: 'CANCELLED',
} as const

export const CreditRole = {
  DEVELOPER: 'DEVELOPER',
  PUBLISHER: 'PUBLISHER',
  PORTING: 'PORTING',
  MARKETING: 'MARKETING',
  SUPPORT: 'SUPPORT',
} as const

// Type helpers derived from constants
export type OrgRoleType = (typeof OrgRole)[keyof typeof OrgRole]
export type GameStatusType = (typeof GameStatus)[keyof typeof GameStatus]
export type CreditRoleType = (typeof CreditRole)[keyof typeof CreditRole]
