import {fetchRequestHandler} from '@trpc/server/adapters/fetch'
import {Hono} from 'hono'
import type {Context} from 'hono'
import {cors} from 'hono/cors'
import {logger} from 'hono/logger'
import {secureHeaders} from 'hono/secure-headers'
import {runOutreachDispatcher} from './cron/outreach-dispatcher'
import {authMiddleware, dbMiddleware, supabaseMiddleware} from './middleware'
import {upload} from './routes/upload'
import type {TRPCContext} from './trpc'
import {appRouter} from './trpc/routers'
import type {AppContext, Env} from './types'

// =============================================================================
// App Setup
// =============================================================================

const app = new Hono<AppContext>()

const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3005',
  'http://localhost:5173',
]

const R2_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const getR2Key = (path: string) => path.replace('/r2/', '')

const createTRPCContext = (c: Context<AppContext>): TRPCContext => ({
  user: c.get('user'),
  supabase: c.get('supabase'),
  env: c.env,
})

// =============================================================================
// Global Middleware
// =============================================================================

app.use('*', logger())
app.use('*', secureHeaders({
  crossOriginResourcePolicy: false,
}))

// Allow cross-origin loading for R2-served assets (images, media)
app.use('/r2/*', async (c, next) => {
  await next()
  c.res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
})

app.use(
  '*',
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
  }),
)

app.use('*', dbMiddleware)
app.use('*', supabaseMiddleware)
app.use('*', authMiddleware)

// =============================================================================
// Upload Handler
// =============================================================================

app.route('/upload', upload)

// =============================================================================
// R2 Object Server (serves uploaded files)
// =============================================================================

app.get('/r2/*', async (c) => {
  const key = getR2Key(c.req.path)
  const reqHeaders = c.req.raw.headers
  const object = await c.env.R2_BUCKET.get(key, {
    onlyIf: reqHeaders,
    range: reqHeaders,
  })

  if (!object) {
    return c.notFound()
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', R2_CACHE_CONTROL)
  headers.set('ETag', object.httpEtag)

  if (!('body' in object)) {
    return new Response(null, {status: 304, headers})
  }

  const status = object.range ? 206 : 200
  return new Response(object.body, {status, headers})
})

// =============================================================================
// tRPC Handler
// =============================================================================

app.all('/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => createTRPCContext(c),
  })
})

// =============================================================================
// Not Found
// =============================================================================

app.notFound((c) => c.json({error: 'Not Found'}, 404))

// =============================================================================
// Export
// =============================================================================

const scheduledHandler = (
  controller: ScheduledController,
  env: Env,
  executionCtx: ExecutionContext,
) => {
  executionCtx.waitUntil((async () => {
    try {
      const summary = await runOutreachDispatcher(env)
      console.log(
        `[outreach-dispatcher] cron=${controller.cron} summary=${JSON.stringify(summary)}`,
      )
    } catch (error) {
      console.error('[outreach-dispatcher] job failed', error)
    }
  })())
}

export default {
  fetch: app.fetch,
  scheduled: scheduledHandler,
}
