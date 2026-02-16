type SlugEntityType = 'studio' | 'game_page'

interface StudioSlugRow {
  id: string
  slug: string
  requested_slug: string | null
}

interface GamePageSlugRow {
  id: string
  game_id: string
  slug: string
  requested_slug: string | null
  is_primary: boolean
}

const TEMP_SLUG_PREFIX_BY_ENTITY: Record<SlugEntityType, string> = {
  studio: 'pending-studio-',
  game_page: 'pending-game-',
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase()
}

function getRandomSlugSuffix(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

async function slugExists(
  supabase: any,
  entityType: SlugEntityType,
  slug: string,
): Promise<boolean> {
  const table = entityType === 'studio' ? 'studios' : 'game_pages'
  const {data} = await supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return Boolean(data)
}

async function createUniqueTemporarySlug(
  supabase: any,
  entityType: SlugEntityType,
): Promise<string> {
  const prefix = TEMP_SLUG_PREFIX_BY_ENTITY[entityType]
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${prefix}${getRandomSlugSuffix()}`
    const exists = await slugExists(supabase, entityType, candidate)
    if (!exists) return candidate
  }

  throw new Error(`Failed to generate unique temporary ${entityType} slug`)
}

export async function demoteStudioSlug(
  supabase: any,
  params: {
    studioId: string
    nowIso: string
    requestedSlug?: string | null
  },
): Promise<StudioSlugRow> {
  const {studioId, nowIso} = params
  const requestedFromInput = params.requestedSlug ? normalizeSlug(params.requestedSlug) : null

  const {data: studio} = await supabase
    .from('studios')
    .select('id, slug, requested_slug')
    .eq('id', studioId)
    .single()

  if (!studio) {
    throw new Error('Studio not found')
  }

  const current = studio as StudioSlugRow
  const requested = requestedFromInput || current.requested_slug || current.slug
  const alreadyDemoted = current.requested_slug === requested && current.slug !== requested

  if (alreadyDemoted) {
    return current
  }

  const tempSlug = await createUniqueTemporarySlug(supabase, 'studio')
  const {data: updated, error} = await supabase
    .from('studios')
    .update({
      slug: tempSlug,
      requested_slug: requested,
      updated_at: nowIso,
    })
    .eq('id', studioId)
    .select('id, slug, requested_slug')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to demote studio slug')
  }

  return updated as StudioSlugRow
}

export async function promoteStudioRequestedSlug(
  supabase: any,
  params: {
    studioId: string
    nowIso: string
  },
): Promise<StudioSlugRow> {
  const {studioId, nowIso} = params

  const {data: studio} = await supabase
    .from('studios')
    .select('id, slug, requested_slug')
    .eq('id', studioId)
    .single()

  if (!studio) {
    throw new Error('Studio not found')
  }

  const current = studio as StudioSlugRow
  if (!current.requested_slug) {
    return current
  }

  const requested = normalizeSlug(current.requested_slug)
  const {data: conflict} = await supabase
    .from('studios')
    .select('id')
    .eq('slug', requested)
    .neq('id', studioId)
    .maybeSingle()

  if (conflict) {
    throw new Error('Requested studio slug is already taken')
  }

  const {data: updated, error} = await supabase
    .from('studios')
    .update({
      slug: requested,
      requested_slug: null,
      updated_at: nowIso,
    })
    .eq('id', studioId)
    .select('id, slug, requested_slug')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to promote studio slug')
  }

  return updated as StudioSlugRow
}

async function getPrimaryGamePage(
  supabase: any,
  gameId: string,
): Promise<GamePageSlugRow | null> {
  const {data: page} = await supabase
    .from('game_pages')
    .select('id, game_id, slug, requested_slug, is_primary')
    .eq('game_id', gameId)
    .eq('is_primary', true)
    .maybeSingle()

  return (page as GamePageSlugRow | null) || null
}

export async function demoteGamePageSlug(
  supabase: any,
  params: {
    pageId: string
    nowIso: string
    requestedSlug?: string | null
  },
): Promise<GamePageSlugRow> {
  const {pageId, nowIso} = params
  const requestedFromInput = params.requestedSlug ? normalizeSlug(params.requestedSlug) : null

  const {data: page} = await supabase
    .from('game_pages')
    .select('id, game_id, slug, requested_slug, is_primary')
    .eq('id', pageId)
    .single()

  if (!page) {
    throw new Error('Game page not found')
  }

  const current = page as GamePageSlugRow
  const requested = requestedFromInput || current.requested_slug || current.slug
  const alreadyDemoted = current.requested_slug === requested && current.slug !== requested

  if (alreadyDemoted) {
    return current
  }

  const tempSlug = await createUniqueTemporarySlug(supabase, 'game_page')
  const {data: updated, error} = await supabase
    .from('game_pages')
    .update({
      slug: tempSlug,
      requested_slug: requested,
      last_slug_change: nowIso,
      updated_at: nowIso,
    })
    .eq('id', pageId)
    .select('id, game_id, slug, requested_slug, is_primary')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to demote game page slug')
  }

  return updated as GamePageSlugRow
}

export async function promoteGamePageRequestedSlug(
  supabase: any,
  params: {
    pageId: string
    nowIso: string
  },
): Promise<GamePageSlugRow> {
  const {pageId, nowIso} = params

  const {data: page} = await supabase
    .from('game_pages')
    .select('id, game_id, slug, requested_slug, is_primary')
    .eq('id', pageId)
    .single()

  if (!page) {
    throw new Error('Game page not found')
  }

  const current = page as GamePageSlugRow
  if (!current.requested_slug) {
    return current
  }

  const requested = normalizeSlug(current.requested_slug)
  const {data: conflict} = await supabase
    .from('game_pages')
    .select('id')
    .eq('slug', requested)
    .neq('id', pageId)
    .maybeSingle()

  if (conflict) {
    throw new Error('Requested game slug is already taken')
  }

  const {data: updated, error} = await supabase
    .from('game_pages')
    .update({
      slug: requested,
      requested_slug: null,
      last_slug_change: nowIso,
      updated_at: nowIso,
    })
    .eq('id', pageId)
    .select('id, game_id, slug, requested_slug, is_primary')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Failed to promote game page slug')
  }

  return updated as GamePageSlugRow
}

export async function demotePrimaryGamePageSlug(
  supabase: any,
  params: {
    gameId: string
    nowIso: string
  },
): Promise<GamePageSlugRow | null> {
  const primaryPage = await getPrimaryGamePage(supabase, params.gameId)
  if (!primaryPage) return null
  return demoteGamePageSlug(supabase, {
    pageId: primaryPage.id,
    nowIso: params.nowIso,
  })
}

export async function promotePrimaryGamePageRequestedSlug(
  supabase: any,
  params: {
    gameId: string
    nowIso: string
  },
): Promise<GamePageSlugRow | null> {
  const primaryPage = await getPrimaryGamePage(supabase, params.gameId)
  if (!primaryPage) return null
  return promoteGamePageRequestedSlug(supabase, {
    pageId: primaryPage.id,
    nowIso: params.nowIso,
  })
}
