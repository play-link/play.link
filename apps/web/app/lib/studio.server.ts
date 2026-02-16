import {createAdminClient} from '@play/supabase-client/server';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface StudioProfile {
  name: string;
  handle: string;
  avatarImage: string | null;
  coverImage: string | null;
  isVerified: boolean;
  canClaimOwnership: boolean;
  theme: {
    backgroundColor: string;
    accentColor: string;
    textColor: string;
  };
  bio: string | null;
  socialLinks: Record<string, string>;
  games: Array<{
    id: string;
    title: string;
    summary: string | null;
    coverUrl: string | null;
    status: string;
    pageSlug: string;
    canClaimOwnership: boolean;
  }>;
}

export async function getStudioProfile(
  env: Env,
  handle: string,
): Promise<StudioProfile | null> {
  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const {data: studio, error} = await supabase
    .from('studios')
    .select('*')
    .eq('slug', handle)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch studio:', error.message);
    return null;
  }

  if (!studio) {
    return null;
  }

  const {data: pages} = await supabase
    .from('game_pages')
    .select('slug, is_claimable, games!inner(id, title, summary, cover_url, status)')
    .eq('games.owner_studio_id', studio.id)
    .eq('visibility', 'PUBLISHED')
    .eq('is_primary', true);

  const games = (pages || []).map((page) => {
    const game = page.games as unknown as {
      id: string;
      title: string;
      summary: string | null;
      cover_url: string | null;
      status: string;
    };
    return {
      id: game.id,
      title: game.title,
      summary: game.summary,
      coverUrl: game.cover_url,
      status: game.status,
      pageSlug: page.slug,
      canClaimOwnership: Boolean(page.is_claimable),
    };
  });

  return {
    name: studio.name,
    handle: studio.slug,
    avatarImage: studio.avatar_url,
    coverImage: studio.cover_url,
    isVerified: studio.is_verified,
    canClaimOwnership: Boolean(studio.is_claimable),
    theme: {
      backgroundColor: studio.background_color || '#030712',
      accentColor: studio.accent_color || '#818cf8',
      textColor: studio.text_color || '#ffffff',
    },
    bio: studio.bio,
    socialLinks: (studio.social_links as Record<string, string>) || {},
    games,
  };
}
