import {TRPCError} from '@trpc/server'
import type {StudioRoleType} from '@play/supabase-client'
import {StudioRole} from '@play/supabase-client'

const ALL_ROLES: StudioRoleType[] = [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MEMBER]

/**
 * Verify user has access to a game via studio membership.
 * Throws FORBIDDEN if user is not a member of the game's owner studio.
 */
export async function verifyGameAccess(
  supabase: any,
  userId: string,
  gameId: string,
  requiredRoles: StudioRoleType[] = ALL_ROLES,
) {
  const {data: game} = await supabase
    .from('games')
    .select('owner_studio_id')
    .eq('id', gameId)
    .single()

  if (!game) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
  }

  const {data: member} = await supabase
    .from('studio_members')
    .select('role')
    .eq('studio_id', game.owner_studio_id)
    .eq('user_id', userId)
    .single()

  if (!member || !requiredRoles.includes(member.role as StudioRoleType)) {
    throw new TRPCError({code: 'FORBIDDEN', message: 'No access to this game'})
  }

  return game
}
