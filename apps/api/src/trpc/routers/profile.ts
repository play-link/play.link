import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {protectedProcedure, router} from '../index'

// Username validation: letters, numbers, underscores, hyphens
const usernameSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[\w-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens',
  )

export const profileRouter = router({
  /**
   * Check if a username is available
   */
  checkUsername: protectedProcedure
    .input(z.object({username: usernameSchema}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data, error} = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', input.username)
        .maybeSingle()

      if (error) {
        return {available: false, error: error.message}
      }

      return {available: data === null}
    }),

  /**
   * Get a profile by user ID
   */
  get: protectedProcedure
    .input(z.object({userId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: profile, error} = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', input.userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return profile
    }),

  /**
   * Update current user's profile
   */
  update: protectedProcedure
    .input(
      z.object({
        username: usernameSchema.optional(),
        displayName: z.string().max(100).optional(),
        avatarUrl: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Build update object
      const updates: Record<string, string | null> = {}
      if (input.username !== undefined) updates.username = input.username
      if (input.displayName !== undefined)
        updates.display_name = input.displayName
      if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nothing to update',
        })
      }

      // Add updated_at
      updates.updated_at = new Date().toISOString()

      const {data: profile, error} = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username already taken',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return profile
    }),

  /**
   * Search profiles by username or email
   */
  search: protectedProcedure
    .input(z.object({query: z.string().min(2).max(100)}))
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      const {data: profiles, error} = await supabase
        .from('profiles')
        .select('user_id, email, username, display_name, avatar_url')
        .or(`username.ilike.%${input.query}%,email.ilike.%${input.query}%`)
        .limit(20)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return profiles || []
    }),
})
