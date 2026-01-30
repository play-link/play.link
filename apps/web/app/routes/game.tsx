import {data} from 'react-router';
import {getGameBySlug} from '../lib/game.server';
import type {Route} from './+types/game';

export async function loader({params, context}: Route.LoaderArgs) {
  const env = context.cloudflare.env as {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  };

  const slug = params.gameSlug;
  if (!slug) {
    throw data('Not Found', {status: 404});
  }

  const game = await getGameBySlug(env, slug);
  if (!game) {
    throw data('Game not found', {status: 404});
  }

  return data(game, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}

export function meta({data: game}: Route.MetaArgs) {
  if (!game) {
    return [{title: 'Game Not Found - Play.link'}];
  }

  const tags: ReturnType<typeof Array<Record<string, string>>> = [
    {title: `${game.title} - Play.link`},
    {
      name: 'description',
      content: game.summary || `${game.title} on Play.link`,
    },
    {property: 'og:title', content: game.title},
    {property: 'og:description', content: game.summary || ''},
    {property: 'og:type', content: 'website'},
    {property: 'og:url', content: `https://play.link/${game.slug}`},
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

export default function GamePage({loaderData}: Route.ComponentProps) {
  const game = loaderData;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {game.header_url && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={game.header_url}
            alt={`${game.title} header`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-6 items-start">
          {game.cover_url && (
            <img
              src={game.cover_url}
              alt={game.title}
              className="w-48 rounded-lg shadow-lg shrink-0"
              style={{aspectRatio: '16 / 9', objectFit: 'cover'}}
            />
          )}
          <div className="flex-1 pt-2">
            <h1 className="text-4xl font-bold">{game.title}</h1>
            {game.summary && (
              <p className="text-gray-300 mt-2 text-lg">{game.summary}</p>
            )}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {game.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {game.trailer_url && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Trailer</h2>
            <a
              href={game.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Watch trailer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
