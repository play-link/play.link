import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {isSlugProtected} from '../lib/protected-slugs'
import {verifyGameAccess} from '../lib/verify-access'
import {downloadToR2} from '../lib/r2'

// Roles that can edit games
const EDIT_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.MEMBER]
// Only owners can delete games
const DELETE_ROLES: StudioRoleType[] = [StudioRole.OWNER]

// Slug validation: lowercase letters, numbers, hyphens only
const slugSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only (e.g., my-game-name)',
  )

function parseSteamAppId(steamUrl: string): string | null {
  return steamUrl.match(/\/app\/(\d+)/)?.[1] || null
}

const steamGameTypes = ['game', 'dlc', 'demo', 'video', 'mod', 'music'] as const
type SteamGameType = (typeof steamGameTypes)[number] | 'unknown'

function normalizeSteamGameType(value: unknown): SteamGameType {
  if (typeof value !== 'string') return 'unknown'
  const normalized = value.trim().toLowerCase()
  return (steamGameTypes as readonly string[]).includes(normalized)
    ? (normalized as SteamGameType)
    : 'unknown'
}

function parseSupportedLanguages(value: unknown): {raw: string | null; languages: string[]} {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {raw: null, languages: []}
  }

  const raw = value.trim()
  const primaryChunk = raw.split('<br>')[0] || raw
  const withoutTags = primaryChunk.replace(/<[^>]+>/g, '')
  const languages = withoutTags
    .split(',')
    .map((entry) => entry.replace(/\*/g, '').trim())
    .filter(Boolean)

  return {raw, languages}
}

function getSteamCoverSourceUrls(data: Record<string, any>): string[] {
  const screenshots: {path_full: string}[] = data.screenshots || []
  const candidates = [
    data.header_image || null,
    data.capsule_imagev5 || null,
    screenshots[0]?.path_full || null,
  ].filter(Boolean) as string[]

  return [...new Set(candidates)]
}

interface SteamImportLink {
  category: string
  type: string
  label: string
  url: string
}

const steamSocialDomains: Array<{
  domains: string[]
  type: string
  category: string
  label: string
}> = [
  {
    domains: ['facebook.com'],
    type: 'website',
    category: 'community',
    label: 'Facebook',
  },
  {
    domains: ['twitter.com', 'x.com'],
    type: 'website',
    category: 'community',
    label: 'X',
  },
  {
    domains: ['instagram.com'],
    type: 'website',
    category: 'community',
    label: 'Instagram',
  },
  {
    domains: ['tiktok.com'],
    type: 'website',
    category: 'community',
    label: 'TikTok',
  },
  {
    domains: ['twitch.tv'],
    type: 'website',
    category: 'community',
    label: 'Twitch',
  },
  {
    domains: ['reddit.com'],
    type: 'website',
    category: 'community',
    label: 'Reddit',
  },
  {
    domains: ['youtube.com', 'youtu.be'],
    type: 'youtube',
    category: 'community',
    label: 'YouTube',
  },
  {
    domains: ['discord.gg', 'discord.com', 'discordapp.com'],
    type: 'discord',
    category: 'community',
    label: 'Discord',
  },
]

function normalizeUrlForDedup(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, '')
}

function decodeHtmlHref(value: string): string {
  return value.replaceAll('&amp;', '&')
}

function hostMatchesDomain(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
}

function unwrapSteamLinkFilterUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    const host = parsed.hostname.toLowerCase()
    const isSteamLinkFilter = host.endsWith('steampowered.com')
      && parsed.pathname.includes('/linkfilter')

    if (!isSteamLinkFilter) return rawUrl

    const externalUrl = parsed.searchParams.get('u') || parsed.searchParams.get('url')
    return externalUrl ? decodeURIComponent(externalUrl) : rawUrl
  } catch {
    return rawUrl
  }
}

function detectSteamImportLink(rawUrl: string): SteamImportLink | null {
  const resolvedUrl = unwrapSteamLinkFilterUrl(rawUrl)

  try {
    const parsed = new URL(resolvedUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const matchedSocial = steamSocialDomains.find((social) =>
      hostMatchesDomain(hostname, social.domains),
    )

    if (!matchedSocial) return null

    return {
      category: matchedSocial.category,
      type: matchedSocial.type,
      label: matchedSocial.label,
      url: parsed.toString(),
    }
  } catch {
    return null
  }
}

function buildSteamImportLinks({
  appId,
  storePageHtml,
  website,
}: {
  appId: string
  storePageHtml: string
  website?: string | null
}): SteamImportLink[] {
  const links: SteamImportLink[] = [
    {
      category: 'store',
      type: 'steam',
      label: 'Steam',
      url: `https://store.steampowered.com/app/${appId}/`,
    },
  ]

  if (website) {
    links.push({
      category: 'other',
      type: 'website',
      label: 'Website',
      url: website,
    })
  }

  if (storePageHtml) {
    const hrefRegex = /href="([^"]+)"/g
    for (const match of storePageHtml.matchAll(hrefRegex)) {
      const href = decodeHtmlHref(match[1] || '')
      const detectedLink = detectSteamImportLink(href)
      if (detectedLink) {
        links.push(detectedLink)
      }
    }
  }

  const dedupedLinks: SteamImportLink[] = []
  const seenUrls = new Set<string>()

  for (const link of links) {
    const normalizedUrl = normalizeUrlForDedup(link.url)
    if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue

    seenUrls.add(normalizedUrl)
    dedupedLinks.push(link)
  }

  return dedupedLinks
}

const MISSING_GAMES_COLUMN_REGEX =
  /Could not find the '([^']+)' column of 'games' in the schema cache/

function getMissingGamesColumn(errorMessage: string): string | null {
  const match = errorMessage.match(MISSING_GAMES_COLUMN_REGEX)
  return match?.[1] || null
}

async function updateGameWithSchemaFallback({
  supabase,
  gameId,
  updates,
}: {
  supabase: any
  gameId: string
  updates: Record<string, unknown>
}) {
  const safeUpdates = {...updates}
  let lastErrorMessage: string | null = null

  for (let attempt = 0; attempt < 10; attempt++) {
    const {data, error} = await supabase
      .from('games')
      .update(safeUpdates)
      .eq('id', gameId)
      .select('*, pages:game_pages(*)')
      .single()

    if (!error) {
      return {updatedGame: data, appliedUpdates: safeUpdates}
    }

    lastErrorMessage = error.message
    const missingColumn = getMissingGamesColumn(error.message)
    if (!missingColumn || !(missingColumn in safeUpdates)) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    delete safeUpdates[missingColumn]
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: lastErrorMessage || 'Failed to update game',
  })
}

export const gameRouter = router({
  /**
   * List games for a studio
   */
  list: protectedProcedure
    .input(z.object({studioId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is member of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this studio',
        })
      }

      const {data: games, error} = await supabase
        .from('games')
        .select('*, pages:game_pages(*)')
        .eq('owner_studio_id', input.studioId)
        .order('created_at', {ascending: false})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return games || []
    }),

  /**
   * Get a game by ID
   */
  get: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.id)

      const {data: game, error} = await supabase
        .from('games')
        .select('*, pages:game_pages(*)')
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      return game
    }),

  /**
   * Create a new game (also creates a primary game_page)
   */
  create: protectedProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        slug: slugSchema,
        title: z.string().min(1).max(200),
        summary: z.string().optional(),
        status: z
          .enum(['IN_DEVELOPMENT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED'])
          .default('IN_DEVELOPMENT'),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const slugProtected = await isSlugProtected(supabase, 'game_page', input.slug)
      const nowIso = new Date().toISOString()

      // Check user is member of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!member || !EDIT_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create games',
        })
      }

      const {data: existingSlug} = await supabase
        .from('game_pages')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle()

      if (existingSlug) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Slug already exists',
        })
      }

      // Insert game
      const {data: game, error: gameError} = await supabase
        .from('games')
        .insert({
          owner_studio_id: input.studioId,
          title: input.title,
          summary: input.summary || null,
          status: input.status,
          // Protected slugs are allowed, but require manual admin verification.
          is_verified: !slugProtected,
          updated_at: nowIso,
        })
        .select()
        .single()

      if (gameError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: gameError.message,
        })
      }

      // Insert primary game_page with the slug
      const {error: pageError} = await supabase
        .from('game_pages')
        .insert({
          game_id: game.id,
          slug: slugProtected
            ? `pending-game-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
            : input.slug,
          requested_slug: slugProtected ? input.slug : null,
          is_primary: true,
          updated_at: nowIso,
        })

      if (pageError) {
        // Rollback game if page creation fails
        await supabase.from('games').delete().eq('id', game.id)

        if (pageError.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Slug already exists',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: pageError.message,
        })
      }

      // Re-fetch with pages joined
      const {data: fullGame} = await supabase
        .from('games')
        .select('*, pages:game_pages(*)')
        .eq('id', game.id)
        .single()

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_CREATE,
        studioId: input.studioId,
        targetType: 'game',
        targetId: game.id,
        metadata: {slug: input.slug, title: game.title},
      })

      return fullGame!
    }),

  /**
   * Update a game (metadata only, no slug)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        summary: z.string().optional().nullable(),
        aboutTheGame: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        type: z.enum(['game', 'dlc', 'demo', 'video', 'mod', 'music', 'unknown']).optional(),
        isFree: z.boolean().optional(),
        controllerSupport: z.string().optional().nullable(),
        supportedLanguages: z.any().optional().nullable(),
        pcRequirements: z.any().optional().nullable(),
        macRequirements: z.any().optional().nullable(),
        linuxRequirements: z.any().optional().nullable(),
        status: z
          .enum(['IN_DEVELOPMENT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED'])
          .optional(),
        releaseDate: z
          .string()
          .date()
          .or(z.string().datetime())
          .optional()
          .nullable(),
        genres: z.array(z.string()).optional(),
        coverUrl: z.string().url().or(z.literal('')).optional().nullable(),
        headerUrl: z.string().url().or(z.literal('')).optional().nullable(),
        trailerUrl: z.string().url().or(z.literal('')).optional().nullable(),
        themeColor: z.string().max(20).optional().nullable(),
        platforms: z
          .array(
            z.enum([
              'PC',
              'Mac',
              'Linux',
              'PS5',
              'Xbox Series',
              'Switch',
              'iOS',
              'Android',
            ]),
          )
          .optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx
      const {id, ...updates} = input

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_studio_id')
        .eq('id', id)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is member of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !EDIT_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this game',
        })
      }

      // Build update object with snake_case keys
      const dbUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.summary !== undefined) dbUpdates.summary = updates.summary
      if (updates.aboutTheGame !== undefined) {
        dbUpdates.about_the_game = updates.aboutTheGame
        dbUpdates.description = updates.aboutTheGame
      } else if (updates.description !== undefined) {
        // Backward compatibility with previous client payload.
        dbUpdates.about_the_game = updates.description
        dbUpdates.description = updates.description
      }
      if (updates.type !== undefined) dbUpdates.type = updates.type
      if (updates.isFree !== undefined) dbUpdates.is_free = updates.isFree
      if (updates.controllerSupport !== undefined) {
        dbUpdates.controller_support = updates.controllerSupport
      }
      if (updates.supportedLanguages !== undefined) {
        dbUpdates.supported_languages = updates.supportedLanguages
      }
      if (updates.pcRequirements !== undefined) {
        dbUpdates.pc_requirements = updates.pcRequirements
      }
      if (updates.macRequirements !== undefined) {
        dbUpdates.mac_requirements = updates.macRequirements
      }
      if (updates.linuxRequirements !== undefined) {
        dbUpdates.linux_requirements = updates.linuxRequirements
      }
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.releaseDate !== undefined)
        dbUpdates.release_date = updates.releaseDate
      if (updates.genres !== undefined) dbUpdates.genres = updates.genres
      if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl
      if (updates.headerUrl !== undefined)
        dbUpdates.header_url = updates.headerUrl
      if (updates.trailerUrl !== undefined)
        dbUpdates.trailer_url = updates.trailerUrl
      if (updates.themeColor !== undefined)
        dbUpdates.theme_color = updates.themeColor
      if (updates.platforms !== undefined)
        dbUpdates.platforms = updates.platforms

      if (Object.keys(dbUpdates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nothing to update',
        })
      }

      dbUpdates.updated_at = new Date().toISOString()

      const {updatedGame, appliedUpdates} = await updateGameWithSchemaFallback({
        supabase,
        gameId: id,
        updates: dbUpdates,
      })

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game',
        targetId: id,
        metadata: {changes: appliedUpdates},
      })

      return updatedGame
    }),

  /**
   * Delete a game
   */
  delete: protectedProcedure
    .input(z.object({id: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the game to check ownership
      const {data: game, error: gameError} = await supabase
        .from('games')
        .select('owner_studio_id, title')
        .eq('id', input.id)
        .single()

      if (gameError || !game) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found',
        })
      }

      // Check user is OWNER or ADMIN of owner studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', game.owner_studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || !DELETE_ROLES.includes(member.role as StudioRoleType)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this game',
        })
      }

      const {error} = await supabase.from('games').delete().eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_DELETE,
        studioId: game.owner_studio_id,
        targetType: 'game',
        targetId: input.id,
        metadata: {title: game.title},
      })

      return {success: true}
    }),

  /**
   * Import game metadata and images from a Steam store page
   */
  steamPreview: protectedProcedure
    .input(
      z.object({
        steamUrl: z.string(),
      }),
    )
    .query(async ({input}) => {
      const appId = parseSteamAppId(input.steamUrl)
      if (!appId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Steam URL. Expected format: https://store.steampowered.com/app/12345/...',
        })
      }

      const [steamResponse, storePageResponse] = await Promise.all([
        fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`),
        fetch(`https://store.steampowered.com/app/${appId}/`, {
          headers: {'Accept-Language': 'en'},
        }),
      ])

      if (!steamResponse.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Steam store data',
        })
      }

      const steamData = (await steamResponse.json()) as Record<string, any>
      const appData = steamData[appId]

      if (!appData?.success || !appData.data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found on Steam. Check the URL and try again.',
        })
      }

      const data = appData.data
      let storePageHtml = ''
      if (storePageResponse.ok) {
        storePageHtml = await storePageResponse.text()
      }
      const genres: string[] = (data.genres || [])
        .map((genre: {description: string}) => genre.description)
      const developers: string[] = data.developers || []
      const publishers: string[] = data.publishers || []
      const supportedLanguages = parseSupportedLanguages(data.supported_languages)

      const platformMap: Record<string, string> = {
        windows: 'PC',
        mac: 'Mac',
        linux: 'Linux',
      }
      const platforms: string[] = Object.entries(data.platforms || {})
        .filter(([, supported]) => supported)
        .map(([key]) => platformMap[key])
        .filter(Boolean)

      let releaseDate: string | null = null
      if (data.release_date && !data.release_date.coming_soon && data.release_date.date) {
        releaseDate = data.release_date.date
      }

      return {
        appId,
        type: normalizeSteamGameType(data.type),
        isFree: Boolean(data.is_free),
        controllerSupport: data.controller_support || null,
        coverImage: getSteamCoverSourceUrls(data)[0] || null,
        capsuleImage: data.capsule_imagev5 || null,
        developers,
        genres,
        aboutTheGame: data.about_the_game || null,
        headerImage: data.header_image || null,
        supportedLanguages,
        pcRequirements: data.pc_requirements || null,
        macRequirements: data.mac_requirements || null,
        linuxRequirements: data.linux_requirements || null,
        platforms,
        publishers,
        releaseDate,
        shortDescription: data.short_description || null,
        suggestedLinks: buildSteamImportLinks({
          appId,
          storePageHtml,
          website: data.website || null,
        }).map((link) => ({
          label: link.label,
          type: link.type,
          url: link.url,
        })),
        steamUrl: `https://store.steampowered.com/app/${appId}/`,
        title: data.name || null,
      }
    }),

  /**
   * Import game metadata and images from a Steam store page
   */
  importFromSteam: protectedProcedure
    .input(
      z.object({
        gameId: z.string().uuid(),
        steamUrl: z.string(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase, env} = ctx

      // Verify access
      const game = await verifyGameAccess(supabase, user.id, input.gameId, EDIT_ROLES)

      // Parse app ID from Steam URL
      const appId = parseSteamAppId(input.steamUrl)
      if (!appId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Steam URL. Expected format: https://store.steampowered.com/app/12345/...',
        })
      }

      // Fetch Steam API and store page HTML in parallel
      const [steamResponse, storePageResponse] = await Promise.all([
        fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`),
        fetch(`https://store.steampowered.com/app/${appId}/`, {
          headers: {'Accept-Language': 'en'},
        }),
      ])

      if (!steamResponse.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Steam store data',
        })
      }

      const steamData = (await steamResponse.json()) as Record<string, any>
      const appData = steamData[appId!]

      if (!appData?.success || !appData.data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Game not found on Steam. Check the URL and try again.',
        })
      }

      const data = appData.data

      // Parse social links from store page HTML
      let storePageHtml = ''
      if (storePageResponse.ok) {
        storePageHtml = await storePageResponse.text()
      }

      // --- Images ---
      // Cover (16:9): Use first screenshot (1920x1080 = exactly 16:9)
      // Header (3:1): Use Steam CDN library_hero.jpg (~3840x1240 ≈ 3.1:1)
      // Screenshots: Already 16:9, store in games/media
      // Fallback cover: capsule_imagev5 (616x353 ≈ 16:9)
      const screenshots: {id: number; path_thumbnail: string; path_full: string}[] =
        data.screenshots || []

      let coverUrl: string | null = null
      let headerUrl: string | null = null

      // Try library_hero from Steam CDN for header (3:1)
      const heroImageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_hero.jpg`
      try {
        const heroCheck = await fetch(heroImageUrl, {method: 'HEAD'})
        if (heroCheck.ok) {
          headerUrl = await downloadToR2(env, heroImageUrl, 'games/headers')
        }
      } catch {
        console.error('Failed to download Steam library_hero image')
      }

      for (const sourceUrl of getSteamCoverSourceUrls(data)) {
        try {
          coverUrl = await downloadToR2(env, sourceUrl, 'games/covers')
          break
        } catch {
          console.error(`Failed to download Steam cover candidate: ${sourceUrl}`)
        }
      }

      // If no header, fall back to header_image (not ideal ratio but better than nothing)
      if (!headerUrl && data.header_image) {
        try {
          headerUrl = await downloadToR2(env, data.header_image, 'games/headers')
        } catch {
          console.error('Failed to download header_image fallback')
        }
      }

      // Map genres
      const genres: string[] = (data.genres || []).map(
        (g: {description: string}) => g.description,
      )

      // Map platforms
      const platformMap: Record<string, string> = {
        windows: 'PC',
        mac: 'Mac',
        linux: 'Linux',
      }
      const platforms: string[] = Object.entries(data.platforms || {})
        .filter(([, supported]) => supported)
        .map(([key]) => platformMap[key])
        .filter(Boolean)

      // Parse release date
      let releaseDate: string | null = null
      if (data.release_date && !data.release_date.coming_soon && data.release_date.date) {
        try {
          const parsed = new Date(data.release_date.date)
          if (!Number.isNaN(parsed.getTime())) {
            releaseDate = parsed.toISOString().split('T')[0]!
          }
        } catch {
          // Non-fatal: skip release date
        }
      }

      // Build game update
      const supportedLanguages = parseSupportedLanguages(data.supported_languages)
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      dbUpdates.type = normalizeSteamGameType(data.type)
      dbUpdates.is_free = Boolean(data.is_free)
      dbUpdates.controller_support = data.controller_support || null
      dbUpdates.supported_languages = supportedLanguages
      dbUpdates.pc_requirements = data.pc_requirements || null
      dbUpdates.mac_requirements = data.mac_requirements || null
      dbUpdates.linux_requirements = data.linux_requirements || null
      if (data.short_description) dbUpdates.summary = data.short_description
      if (data.about_the_game) {
        dbUpdates.about_the_game = data.about_the_game
        dbUpdates.description = data.about_the_game
      } else if (data.detailed_description) {
        dbUpdates.about_the_game = data.detailed_description
        dbUpdates.description = data.detailed_description
      }
      if (coverUrl) dbUpdates.cover_url = coverUrl
      if (headerUrl) dbUpdates.header_url = headerUrl
      if (genres.length > 0) dbUpdates.genres = genres
      if (platforms.length > 0) dbUpdates.platforms = platforms
      if (releaseDate) dbUpdates.release_date = releaseDate

      // Update the game
      const {updatedGame} = await updateGameWithSchemaFallback({
        supabase,
        gameId: input.gameId,
        updates: dbUpdates,
      })

      // Download screenshots and create game_media records
      for (let i = 0; i < screenshots.length; i++) {
        const screenshot = screenshots[i]!
        try {
          const imageUrl = await downloadToR2(env, screenshot.path_full, 'games/media')
          let thumbnailUrl: string | null = null
          try {
            thumbnailUrl = await downloadToR2(env, screenshot.path_thumbnail, 'games/media')
          } catch {
            // Non-fatal: skip thumbnail
          }

          await supabase.from('game_media').insert({
            game_id: input.gameId,
            type: 'image',
            url: imageUrl,
            thumbnail_url: thumbnailUrl,
            position: i,
          })
        } catch {
          // Non-fatal: continue with next screenshot
          console.error(`Failed to import screenshot ${i}`)
        }
      }

      const linksToCreate = buildSteamImportLinks({
        appId,
        storePageHtml,
        website: data.website || null,
      }).map((link, position) => ({...link, position}))

      // Insert all links
      for (const link of linksToCreate) {
        try {
          await supabase.from('game_links').insert({
            game_id: input.gameId,
            ...link,
          })
        } catch {
          console.error(`Failed to import link: ${link.label}`)
        }
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.GAME_UPDATE,
        studioId: game.owner_studio_id,
        targetType: 'game',
        targetId: input.gameId,
        metadata: {source: 'steam', steamAppId: appId},
      })

      return updatedGame
    }),
})
