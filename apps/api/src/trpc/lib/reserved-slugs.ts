type ProtectedSlugEntityType = 'studio' | 'game_page'

const reservedStudioSlugs = [
  'nintendo',
  'playstation',
  'xbox',
  'epic-games',
  'rockstar-games',
  'riot-games',
] as const

const reservedGamePageSlugs = [
  'fortnite',
  'minecraft',
  'roblox',
  'valorant',
  'league-of-legends',
  'counter-strike-2',
  'gta-6',
] as const

const reservedByEntityType: Record<ProtectedSlugEntityType, ReadonlySet<string>> = {
  studio: new Set(reservedStudioSlugs),
  game_page: new Set(reservedGamePageSlugs),
}

export function isReservedSlug(
  entityType: ProtectedSlugEntityType,
  slug: string,
): boolean {
  return reservedByEntityType[entityType].has(slug.trim().toLowerCase())
}
