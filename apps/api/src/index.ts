import {fetchRequestHandler} from '@trpc/server/adapters/fetch'
import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {logger} from 'hono/logger'
import {authMiddleware, dbMiddleware, supabaseMiddleware} from './middleware'
import type {TRPCContext} from './trpc'
import {appRouter} from './trpc/routers'
import type {AppContext} from './types'

// =============================================================================
// App Setup
// =============================================================================

const app = new Hono<AppContext>()

// =============================================================================
// Global Middleware
// =============================================================================

app.use('*', logger())

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3005',
    ],
    credentials: true,
  }),
)

app.use('*', dbMiddleware)
app.use('*', supabaseMiddleware)
app.use('*', authMiddleware)

// =============================================================================
// tRPC Handler
// =============================================================================

app.all('/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: (): TRPCContext => ({
      user: c.get('user'),
      supabase: c.get('supabase'),
      env: c.env,
    }),
  });
});

// =============================================================================
// Export
// =============================================================================

export default app
