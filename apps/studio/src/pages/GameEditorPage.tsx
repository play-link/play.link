import {useParams} from 'react-router';
import {GameEditor} from '@/components/games';

export function GameEditorPage() {
  const {gameId} = useParams<{gameId: string}>();

  if (!gameId) {
    return <div>Game not found</div>;
  }

  return <GameEditor gameId={gameId} />;
}
