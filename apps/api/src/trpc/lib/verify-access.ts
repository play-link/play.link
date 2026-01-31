import {TRPCError} from '@trpc/server'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'

const ALL_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER]

/**
 * Verify user has access to a game via org membership.
 * Throws FORBIDDEN if user is not a member of the game's owner org.
 */
export async function verifyGameAccess(
  supabase: any,
  userId: string,
  gameId: string,
  requiredRoles: OrgRoleType[] = ALL_ROLES,
) {
  const {data: game} = await supabase
    .from('games')
    .select('owner_organization_id')
    .eq('id', gameId)
    .single()

  if (!game) {
    throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
  }

  const {data: member} = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', game.owner_organization_id)
    .eq('user_id', userId)
    .single()

  if (!member || !requiredRoles.includes(member.role as OrgRoleType)) {
    throw new TRPCError({code: 'FORBIDDEN', message: 'No access to this game'})
  }

  return game
}
