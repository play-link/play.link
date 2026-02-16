import {data} from 'react-router';
import {createAdminClient} from '@play/supabase-client/server';
import type {Tables} from '@play/supabase-client';
import {getGamePageBySlug} from '../lib/game.server';
import type {Route} from './+types/press-kit';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface CloudflareLoadContext {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}

interface LoaderData {
  game: Tables<'games'>;
  page: Tables<'game_pages'>;
  links: GameLink[];
  media: GameMedia[];
  studioName: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  IN_DEVELOPMENT: 'In Development',
  UPCOMING: 'Upcoming',
  EARLY_ACCESS: 'Early Access',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
};

export async function loader({params, context}: Route.LoaderArgs) {
  const cf = context as unknown as CloudflareLoadContext;
  const env = cf.cloudflare.env;
  const slug = params.slug;

  if (!slug) {
    throw data('Not Found', {status: 404});
  }

  const result = await getGamePageBySlug(env, slug);
  if (!result) {
    throw data('Game not found', {status: 404});
  }

  const {page, game} = result;
  const supabase = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [{data: links}, {data: media}, {data: studio}] = await Promise.all([
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
    supabase
      .from('studios')
      .select('name')
      .eq('id', game.owner_studio_id)
      .single(),
  ]);

  return data(
    {
      game,
      page,
      links: (links || []) as GameLink[],
      media: (media || []) as GameMedia[],
      studioName: studio?.name ?? null,
    } satisfies LoaderData,
    {headers: {'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'}},
  );
}

export function meta({data: loaderData}: Route.MetaArgs) {
  if (!loaderData) {
    return [{title: 'Not Found - Play.link'}];
  }
  const d = loaderData as LoaderData;
  return [
    {title: `${d.game.title} - Press Kit - Play.link`},
    {name: 'description', content: `Press kit for ${d.game.title}`},
  ];
}

export default function PressKitPage({loaderData}: Route.ComponentProps) {
  const d = loaderData as LoaderData;
  const {game, links, media, studioName} = d;

  const storeLinks = links.filter((l) => l.category === 'store');
  const socialLinks = links.filter((l) => l.category === 'social');
  const images = media.filter((m) => m.type === 'image');
  const videos = media.filter((m) => m.type === 'video');
  const description = game.about_the_game as string | null;
  const genres = Array.isArray(game.genres) ? (game.genres as string[]) : [];
  const platforms = Array.isArray(game.platforms) ? (game.platforms as string[]) : [];
  const platformLinks = links.filter((l) => l.category === 'platform');

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden bg-gray-900">
        {game.header_url ? (
          <>
            <img
              src={game.header_url}
              alt={`${game.title} header`}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
          </>
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-6 flex items-end gap-6">
          {game.cover_url && (
            <img
              src={game.cover_url}
              alt={game.title}
              className="w-36 h-36 rounded-lg object-cover border-2 border-white shadow-lg shrink-0"
            />
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white m-0 leading-tight">
              {game.title}
            </h1>
            {studioName && (
              <p className="text-white/70 mt-1 text-sm m-0">
                By {studioName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-10">
          {/* Factsheet */}
          <aside className="flex flex-col gap-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 m-0">
              Factsheet
            </h2>

            {storeLinks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 mt-0">
                  Platform:
                </h3>
                <div className="flex flex-col gap-1">
                  {storeLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 mt-0">
                  Social Media:
                </h3>
                <div className="flex flex-col gap-1">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {game.status && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 mt-0">
                  Status:
                </h3>
                <p className="text-sm m-0">{STATUS_LABELS[game.status] || game.status}</p>
              </div>
            )}

            {game.release_date && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 mt-0">
                  Release Date:
                </h3>
                <p className="text-sm m-0">
                  {new Date(game.release_date).toLocaleDateString('en', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {genres.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 mt-0">
                  Genres:
                </h3>
                <p className="text-sm m-0">{genres.join(', ')}</p>
              </div>
            )}

            {platforms.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 mt-0">
                  Platforms:
                </h3>
                <p className="text-sm m-0">
                  {platforms.join(', ')}
                </p>
              </div>
            )}

            {platformLinks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 mt-0">
                  Available on:
                </h3>
                <div className="flex flex-col gap-1">
                  {platformLinks.map((link) => (
                    link.url ? (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span key={link.id} className="text-sm text-gray-600">
                        {link.label}{(link as unknown as Record<string, unknown>).coming_soon ? ' (Coming soon)' : ''}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Descriptions */}
          <div className="flex flex-col gap-8">
            {game.summary && (
              <div>
                <h2 className="text-lg font-bold mb-2 mt-0">Pitch</h2>
                <p className="text-base leading-relaxed text-gray-700 m-0">
                  {game.summary}
                </p>
              </div>
            )}

            {description && (
              <div>
                <h2 className="text-lg font-bold mb-2 mt-0">Description</h2>
                <div className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        {(videos.length > 0 || images.length > 0) && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 mt-0">Media</h2>

            {/* Trailers */}
            {videos.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-semibold mb-3 mt-0">Trailers</h3>
                <div className="flex flex-col gap-2">
                  {videos.map((v) => (
                    <a
                      key={v.id}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {game.title} — Video
                    </a>
                  ))}
                  {game.trailer_url && !videos.some((v) => v.url === game.trailer_url) && (
                    <a
                      href={game.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {game.title} — Trailer
                    </a>
                  )}
                </div>
              </div>
            )}

            {videos.length === 0 && game.trailer_url && (
              <div className="mb-8">
                <h3 className="text-base font-semibold mb-3 mt-0">Trailers</h3>
                <a
                  href={game.trailer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {game.title} — Trailer
                </a>
              </div>
            )}

            {/* Screenshots */}
            {images.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 mt-0">Screenshots</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden"
                    >
                      <img
                        src={img.thumbnail_url || img.url}
                        alt=""
                        className="w-full aspect-video object-cover hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
