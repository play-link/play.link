import {TRPCError} from '@trpc/server'
import {protectedProcedure, router} from '../index'

export const meRouter = router({
  /**
   * Get current user's profile and organizations
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

    // Get user's organizations with their role
    const {data: memberships, error: memberError} = await supabase
      .from('organization_members')
      .select('role, organizations (*)')
      .eq('user_id', user.id)

    if (memberError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: memberError.message,
      })
    }

    // Transform memberships to include role at org level
    // Note: organizations is typed as array by Supabase but returns single object
    // due to the FK relationship from organization_members -> organizations
    const organizations =
      memberships
        ?.filter((m) => m.organizations !== null)
        .map((m) => {
          const org = m.organizations as unknown as {
            id: string
            name: string
            slug: string
          }
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            role: m.role,
          }
        }) || []

    return {
      profile,
      organizations,
    }
  }),
})
