import type {Tables} from '@play/supabase-client';
import {createAdminClient} from '@play/supabase-client/server';

export type Game = Tables<'games'>;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function getGameBySlug(
  env: Env,
  slug: string,
): Promise<Game | null> {
  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {data, error} = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .in('status', ['RELEASED', 'EARLY_ACCESS', 'UPCOMING'])
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch game:', error.message);
    return null;
  }

  return data;
}
