import {LayoutGridIcon, ListIcon} from 'lucide-react'
import type {GamesViewMode, GamesVisibilityFilter} from './types'

export const gamesViewModeOptions: Array<{
  label: string
  value: GamesViewMode
  icon: typeof LayoutGridIcon
}> = [
  {label: 'Grid view', value: 'grid', icon: LayoutGridIcon},
  {label: 'List view', value: 'list', icon: ListIcon},
]

export const gamesVisibilityFilterItems: Array<{
  label: string
  value: GamesVisibilityFilter
}> = [
  {label: 'All', value: 'all'},
  {label: 'Published', value: 'published'},
  {label: 'Draft', value: 'draft'},
]
