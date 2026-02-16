import {useCallback, useState} from 'react'
import type {GamesViewMode} from './types'
import {isGamesViewMode} from './utils'

const STORAGE_KEY = 'games-view-mode'

export function useGamesViewMode(defaultValue: GamesViewMode = 'grid') {
  const [viewMode, setViewModeState] = useState<GamesViewMode>(() => {
    if (typeof window === 'undefined') return defaultValue

    const storedMode = window.localStorage.getItem(STORAGE_KEY)
    return isGamesViewMode(storedMode) ? storedMode : defaultValue
  })

  const setViewMode = useCallback((mode: GamesViewMode) => {
    setViewModeState(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode)
    }
  }, [])

  return {viewMode, setViewMode}
}
