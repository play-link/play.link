import type {SupabaseClient} from '@supabase/supabase-js'
import {TRPCError, initTRPC} from '@trpc/server'

// =============================================================================
// Context
// =============================================================================

export interface TRPCContext {
  user: {id: string; email: string} | null
  supabase: SupabaseClient
}

// =============================================================================
// tRPC Initializations
// =============================================================================

const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authenticated user
 */
export const protectedProcedure = t.procedure.use(({ctx, next}) => {
  if (!ctx.user) {
    throw new TRPCError({code: 'UNAUTHORIZED'})
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to be non-null
    },
  })
})
