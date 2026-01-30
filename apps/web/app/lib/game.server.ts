import type {Tables} from '@play/supabase-client';
import {createAdminClient} from '@play/supabase-client/server';

export type Game = Tables<'games'>;
export type GamePage = Tables<'game_pages'>;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function getGamePageBySlug(
  env: Env,
  slug: string,
): Promise<{page: GamePage; game: Game} | null> {
  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {data, error} = await supabase
    .from('game_pages')
    .select('*, game:games(*)')
    .eq('slug', slug)
    .eq('visibility', 'PUBLISHED')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch game page:', error.message);
    return null;
  }

  if (!data || !data.game) {
    return null;
  }

  return {page: data, game: data.game};
}
