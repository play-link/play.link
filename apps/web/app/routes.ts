import {index, route} from '@react-router/dev/routes';
import type {RouteConfig} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('api/track', 'routes/api.track.ts'),
  route('api/subscribe', 'routes/api.subscribe.ts'),
  route('api/report', 'routes/api.report.ts'),
  route('unsubscribe', 'routes/unsubscribe.tsx'),
  route(':slug/press-kit', 'routes/press-kit.tsx'),
  route(':slug', 'routes/slug.tsx'),
] satisfies RouteConfig;
