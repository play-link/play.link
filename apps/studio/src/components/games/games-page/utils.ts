import type {
  GamePageRecord,
  GameRow,
  GamesSortOption,
  GamesViewMode,
  GamesVisibilityFilter,
  StudioGame,
} from './types'

const gamesViewModes: GamesViewMode[] = ['grid', 'list']
const gamesVisibilityFilters: GamesVisibilityFilter[] = ['all', 'published', 'draft']

export function isGamesViewMode(value: string | null): value is GamesViewMode {
  return value !== null && gamesViewModes.includes(value as GamesViewMode)
}

export function isGamesVisibilityFilter(
  value: string | null,
): value is GamesVisibilityFilter {
  return value !== null
    && gamesVisibilityFilters.includes(value as GamesVisibilityFilter)
}

export function getPrimaryGamePage(game: StudioGame): GamePageRecord | undefined {
  return (game.pages as GamePageRecord[] | null)?.find((page) => page.is_primary)
}

export function isGamePublished(game: StudioGame): boolean {
  return getPrimaryGamePage(game)?.visibility === 'PUBLISHED'
}

export function filterAndSortGames(
  games: StudioGame[],
  visibilityFilter: GamesVisibilityFilter,
  sort: GamesSortOption,
): StudioGame[] {
  const filteredGames
    = visibilityFilter === 'all'
      ? games
      : games.filter((game) =>
          visibilityFilter === 'published'
            ? isGamePublished(game)
            : !isGamePublished(game),
        )

  return [...filteredGames].sort((a, b) => {
    if (sort === 'name') return a.title.localeCompare(b.title)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function toGameRow(game: StudioGame): GameRow {
  const primaryPage = getPrimaryGamePage(game)
  return {
    id: game.id,
    title: game.title,
    slug: primaryPage?.slug ?? '',
    coverUrl: game.cover_url,
    published: isGamePublished(game),
    updatedAt: game.updated_at,
    createdAt: game.created_at,
  }
}
