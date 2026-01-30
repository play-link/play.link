import type {SupabaseClient} from '@supabase/supabase-js'
import {TRPCError, initTRPC} from '@trpc/server'
import type {Env} from '../types'

// =============================================================================
// Context
// =============================================================================

export interface TRPCContext {
  user: {id: string; email: string} | null
  supabase: SupabaseClient
  env: Env
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

/**
 * Admin procedure - requires super admin user
 */
export const adminProcedure = protectedProcedure.use(({ctx, next}) => {
  if (ctx.user.email !== ctx.env.SUPER_ADMIN_EMAIL) {
    throw new TRPCError({code: 'FORBIDDEN'})
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
