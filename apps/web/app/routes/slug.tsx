import {data} from 'react-router';
import {createAdminClient} from '@play/supabase-client/server';
import type {Tables} from '@play/supabase-client';
import {trackEvent} from '../lib/analytics.server';
import {trackCampaignClick} from '../lib/campaign.server';
import {getGamePageBySlug} from '../lib/game.server';
import {getStudioProfile} from '../lib/studio.server';
import type {StudioProfile} from '../lib/studio.server';
import {GamePageView} from '../components/GamePageView';
import {StudioProfileView} from '../components/StudioProfileView';
import type {Route} from './+types/slug';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

interface GameUpdate {
  id: string;
  title: string;
  body: string;
  cta_url: string | null;
  cta_label: string | null;
  published_at: string | null;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPER_ADMIN_EMAIL?: string;
}

interface CloudflareLoadContext {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}

type LoaderData =
  | {type: 'studio'; profile: StudioProfile}
  | {
      type: 'game';
      game: Tables<'games'>;
      page: Tables<'game_pages'>;
      links: GameLink[];
      media: GameMedia[];
      updates: GameUpdate[];
    };

export async function loader({params, context, request}: Route.LoaderArgs) {
  const cf = context as unknown as CloudflareLoadContext;
  const env = cf.cloudflare.env;
  const slug = params.slug;

  if (!slug) {
    throw data('Not Found', {status: 404});
  }

  // Studio profile: /@handle
  if (slug.startsWith('@')) {
    const handle = slug.slice(1);
    if (!handle) {
      throw data('Not Found', {status: 404});
    }

    const profile = await getStudioProfile(env, handle);
    if (!profile) {
      throw data('Studio not found', {status: 404});
    }

    return data(
      {type: 'studio' as const, profile},
      {headers: {'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'}},
    );
  }

  // Game page: /game-slug
  const result = await getGamePageBySlug(env, slug);
  if (!result) {
    throw data('Game not found', {status: 404});
  }

  const {page, game} = result;

  // Check for page-level redirect (temporary redirect to external URL)
  const pageConfig = (page.page_config && typeof page.page_config === 'object' && !Array.isArray(page.page_config))
    ? (page.page_config as {redirectUrl?: string})
    : {};
  if (pageConfig.redirectUrl) {
    return new Response(null, {
      status: 302,
      headers: {Location: pageConfig.redirectUrl},
    }) as any;
  }

  const supabase = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [{data: links}, {data: media}, {data: updates}] = await Promise.all([
    supabase
      .from('game_links')
      .select('*')
      .eq('game_id', game.id)
      .order('position', {ascending: true}),
    supabase
      .from('game_media')
      .select('*')
      .eq('game_id', game.id)
      .order('position', {ascending: true}),
    (supabase as any)
      .from('game_updates')
      .select('id, title, body, cta_url, cta_label, published_at')
      .eq('game_id', game.id)
      .eq('status', 'published')
      .order('published_at', {ascending: false})
      .limit(5),
  ]);

  cf.cloudflare.ctx.waitUntil(
    trackEvent(env, {gameId: game.id, eventType: 'page_view', request}),
  );

  const url = new URL(request.url);
  const campaignSlug = url.searchParams.get('c');
  if (campaignSlug) {
    const {data: campaign} = await supabase
      .from('campaigns')
      .select('id, destination, destination_url, status')
      .eq('game_id', game.id)
      .eq('slug', campaignSlug)
      .single();

    if (campaign && campaign.status === 'active') {
      cf.cloudflare.ctx.waitUntil(
        trackCampaignClick(env, {campaignId: campaign.id, request}),
      );

      if (campaign.destination !== 'game_page' && campaign.destination_url) {
        return new Response(null, {
          status: 302,
          headers: {Location: campaign.destination_url},
        }) as any;
      }
    }
  }

  return data(
    {
      type: 'game' as const,
      game,
      page,
      links: (links || []) as GameLink[],
      media: (media || []) as GameMedia[],
      updates: (updates || []) as GameUpdate[],
    },
    {headers: {'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'}},
  );
}

export function meta({data: loaderData}: Route.MetaArgs) {
  if (!loaderData) {
    return [{title: 'Not Found - Play.link'}];
  }

  if (loaderData.type === 'studio') {
    const {profile} = loaderData;
    const tags: Array<Record<string, string>> = [
      {title: `${profile.name} (@${profile.handle}) - Play.link`},
      {name: 'description', content: profile.bio || `${profile.name} on Play.link`},
      {property: 'og:title', content: `${profile.name} (@${profile.handle})`},
      {property: 'og:description', content: profile.bio || `${profile.name} on Play.link`},
      {property: 'og:type', content: 'profile'},
      {property: 'og:url', content: `https://play.link/@${profile.handle}`},
      {name: 'twitter:card', content: 'summary'},
      {name: 'twitter:title', content: `${profile.name} (@${profile.handle})`},
      {name: 'twitter:description', content: profile.bio || `${profile.name} on Play.link`},
    ];
    if (profile.avatarImage) {
      tags.push({property: 'og:image', content: profile.avatarImage});
      tags.push({name: 'twitter:image', content: profile.avatarImage});
    }
    return tags;
  }

  const {game, page} = loaderData;
  const tags: Array<Record<string, string>> = [
    {title: `${game.title} - Play.link`},
    {name: 'description', content: game.summary || `${game.title} on Play.link`},
    {property: 'og:title', content: game.title},
    {property: 'og:description', content: game.summary || ''},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: `https://play.link/${page.slug}`},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: game.title},
    {name: 'twitter:description', content: game.summary || ''},
  ];
  if (game.cover_url) {
    tags.push({property: 'og:image', content: game.cover_url});
    tags.push({name: 'twitter:image', content: game.cover_url});
  }
  if (game.theme_color) {
    tags.push({name: 'theme-color', content: game.theme_color});
  }
  return tags;
}

export default function SlugPage({loaderData}: Route.ComponentProps) {
  const d = loaderData as LoaderData;

  if (d.type === 'studio') {
    return <StudioProfileView profile={d.profile} />;
  }

  const themeConfig = (d.page.page_config as Record<string, unknown> | null)?.theme as
    | Record<string, string>
    | undefined;
  const font = themeConfig?.fontFamily;
  const fontFamily = font ? font.replace(/ /g, '+') : null;

  return (
    <>
      {fontFamily && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;600;700&display=swap`} />
        </>
      )}
      <GamePageView
        game={d.game}
        page={d.page}
        links={d.links}
        media={d.media}
        updates={d.updates}
      />
    </>
  );
}
