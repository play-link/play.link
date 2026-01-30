import {index, route} from '@react-router/dev/routes';
import type {RouteConfig} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('api/track', 'routes/api.track.ts'),
  route('api/subscribe', 'routes/api.subscribe.ts'),
  route(':gameSlug', 'routes/game.tsx'),
] satisfies RouteConfig;
