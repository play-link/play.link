import {isReservedSlug} from './reserved-slugs'

export type ProtectedSlugEntityType = 'studio' | 'game_page'

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase()
}

export async function isSlugProtected(
  supabase: any,
  entityType: ProtectedSlugEntityType,
  slug: string,
): Promise<boolean> {
  const normalizedSlug = normalizeSlug(slug)

  if (isReservedSlug(entityType, normalizedSlug)) {
    return true
  }

  const {data} = await supabase
    .from('protected_slugs')
    .select('id')
    .eq('entity_type', entityType)
    .eq('slug', normalizedSlug)
    .maybeSingle()

  return !!data
}
