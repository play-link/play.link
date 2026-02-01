import {TRPCError} from '@trpc/server'
import {protectedProcedure, router} from '../index'

export const meRouter = router({
  /**
   * Get current user's profile and studios
   */
  get: protectedProcedure.query(async ({ctx}) => {
    const {user, supabase} = ctx

    // Get user profile
    const {data: profile, error: profileError} = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: profileError.message,
      })
    }

    // Get user's studios with their role
    const {data: memberships, error: memberError} = await supabase
      .from('studio_members')
      .select('role, studios (*)')
      .eq('user_id', user.id)

    if (memberError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: memberError.message,
      })
    }

    // Transform memberships to include role at studio level
    // Note: studios is typed as array by Supabase but returns single object
    // due to the FK relationship from studio_members -> studios
    const studios =
      memberships
        ?.filter((m) => m.studios !== null)
        .map((m) => {
          const studio = m.studios as unknown as {
            id: string
            name: string
            slug: string
            avatar_url: string | null
            cover_url: string | null
            background_color: string | null
            accent_color: string | null
            text_color: string | null
            bio: string | null
            social_links: Record<string, string> | null
          }
          return {
            id: studio.id,
            name: studio.name,
            slug: studio.slug,
            avatar_url: studio.avatar_url,
            cover_url: studio.cover_url,
            background_color: studio.background_color,
            accent_color: studio.accent_color,
            text_color: studio.text_color,
            bio: studio.bio,
            social_links: studio.social_links,
            role: m.role,
          }
        }) || []

    return {
      profile,
      studios,
    }
  }),
})
