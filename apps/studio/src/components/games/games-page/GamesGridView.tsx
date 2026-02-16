import styled from 'styled-components'
import {GameCard} from '../GameCard'
import type {StudioGame} from './types'
import {getPrimaryGamePage, isGamePublished} from './utils'

interface GamesGridViewProps {
  games: StudioGame[]
  onGameClick: (gameId: string) => void
}

export function GamesGridView({games, onGameClick}: GamesGridViewProps) {
  return (
    <Grid>
      {games.map((game) => (
        <GameCard
          key={game.id}
          id={game.id}
          title={game.title}
          slug={getPrimaryGamePage(game)?.slug ?? ''}
          coverUrl={game.cover_url}
          published={isGamePublished(game)}
          onClick={() => onGameClick(game.id)}
        />
      ))}
    </Grid>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--spacing-18) var(--spacing-8);
`
