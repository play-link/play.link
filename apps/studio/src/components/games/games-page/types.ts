import type {AppRouter} from '@play/api/trpc'
import type {Tables} from '@play/supabase-client'
import type {inferRouterOutputs} from '@trpc/server'

type RouterOutput = inferRouterOutputs<AppRouter>

export type StudioGame = RouterOutput['game']['list'][number]
export type GamePageRecord = Tables<'game_pages'>

export type GamesVisibilityFilter = 'all' | 'published' | 'draft'
export type GamesSortOption = 'recent' | 'name'
export type GamesViewMode = 'grid' | 'list'

export interface GameRow {
  id: string
  title: string
  slug: string
  coverUrl: string | null
  published: boolean
  updatedAt: string | null
  createdAt: string
}
