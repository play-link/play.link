import type {SupabaseClient} from '@supabase/supabase-js'
import {TRPCError} from '@trpc/server'

export interface OutreachTargetReference {
  target_type: 'game' | 'studio'
  target_game_id: string | null
  target_studio_id: string | null
  target_slug: string | null
}

export interface ResolvedOutreachTargetSlugs {
  target_real_slug: string | null
  target_requested_slug: string | null
}

function normalizeSlug(value: string | null | undefined) {
  return value?.replace(/^@/, '').trim().toLowerCase() || null
}

export async function resolveOutreachTargetSlugs({
  supabase,
  targets,
  errorMessage,
}: {
  supabase: SupabaseClient
  targets: OutreachTargetReference[]
  errorMessage: string
}): Promise<ResolvedOutreachTargetSlugs[]> {
  if (targets.length === 0) return []

  const studioIds = Array.from(
    new Set(
      targets
        .filter((target) => target.target_type === 'studio' && target.target_studio_id)
        .map((target) => target.target_studio_id as string),
    ),
  )
  const gameIds = Array.from(
    new Set(
      targets
        .filter((target) => target.target_type === 'game' && target.target_game_id)
        .map((target) => target.target_game_id as string),
    ),
  )
  const fallbackSlugs = Array.from(
    new Set(
      targets
        .map((target) => normalizeSlug(target.target_slug))
        .filter((slug): slug is string => Boolean(slug)),
    ),
  )

  const [
    {data: studiosById, error: studiosByIdError},
    {data: pagesByGameId, error: pagesByGameIdError},
    {data: studiosBySlug, error: studiosBySlugError},
    {data: studiosByRequestedSlug, error: studiosByRequestedSlugError},
    {data: pagesBySlug, error: pagesBySlugError},
    {data: pagesByRequestedSlug, error: pagesByRequestedSlugError},
  ] = await Promise.all([
    studioIds.length > 0
      ? supabase.from('studios').select('id, slug, requested_slug').in('id', studioIds)
      : Promise.resolve({data: [], error: null}),
    gameIds.length > 0
      ? supabase
        .from('game_pages')
        .select('game_id, slug, requested_slug')
        .eq('is_primary', true)
        .in('game_id', gameIds)
      : Promise.resolve({data: [], error: null}),
    fallbackSlugs.length > 0
      ? supabase.from('studios').select('id, slug, requested_slug').in('slug', fallbackSlugs)
      : Promise.resolve({data: [], error: null}),
    fallbackSlugs.length > 0
      ? supabase.from('studios').select('id, slug, requested_slug').in('requested_slug', fallbackSlugs)
      : Promise.resolve({data: [], error: null}),
    fallbackSlugs.length > 0
      ? supabase
        .from('game_pages')
        .select('game_id, slug, requested_slug')
        .eq('is_primary', true)
        .in('slug', fallbackSlugs)
      : Promise.resolve({data: [], error: null}),
    fallbackSlugs.length > 0
      ? supabase
        .from('game_pages')
        .select('game_id, slug, requested_slug')
        .eq('is_primary', true)
        .in('requested_slug', fallbackSlugs)
      : Promise.resolve({data: [], error: null}),
  ])

  if (
    studiosByIdError
    || pagesByGameIdError
    || studiosBySlugError
    || studiosByRequestedSlugError
    || pagesBySlugError
    || pagesByRequestedSlugError
  ) {
    const message = studiosByIdError?.message
      || pagesByGameIdError?.message
      || studiosBySlugError?.message
      || studiosByRequestedSlugError?.message
      || pagesBySlugError?.message
      || pagesByRequestedSlugError?.message
      || errorMessage

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }

  const studioById = new Map(
    (studiosById || []).map((studio) => [studio.id, studio] as const),
  )
  const pageByGameId = new Map(
    (pagesByGameId || []).map((page) => [page.game_id, page] as const),
  )
  const studioBySlug = new Map<string, {id: string; slug: string; requested_slug: string | null}>()
  for (const studio of [...(studiosBySlug || []), ...(studiosByRequestedSlug || [])]) {
    if (studio.slug) studioBySlug.set(studio.slug, studio)
    if (studio.requested_slug) studioBySlug.set(studio.requested_slug, studio)
  }
  const pageBySlug = new Map<string, {game_id: string; slug: string; requested_slug: string | null}>()
  for (const page of [...(pagesBySlug || []), ...(pagesByRequestedSlug || [])]) {
    if (page.slug) pageBySlug.set(page.slug, page)
    if (page.requested_slug) pageBySlug.set(page.requested_slug, page)
  }

  return targets.map((target) => {
    const normalizedTargetSlug = normalizeSlug(target.target_slug)

    if (target.target_type === 'studio') {
      const studio = (target.target_studio_id ? studioById.get(target.target_studio_id) : null)
        || (normalizedTargetSlug ? studioBySlug.get(normalizedTargetSlug) : null)

      return {
        target_real_slug: studio?.slug || null,
        target_requested_slug: studio?.requested_slug || null,
      }
    }

    const page = (target.target_game_id ? pageByGameId.get(target.target_game_id) : null)
      || (normalizedTargetSlug ? pageBySlug.get(normalizedTargetSlug) : null)

    return {
      target_real_slug: page?.slug || null,
      target_requested_slug: page?.requested_slug || null,
    }
  })
}
