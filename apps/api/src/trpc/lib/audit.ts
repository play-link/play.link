import type {SupabaseClient} from '@supabase/supabase-js'

export const AuditAction = {
  // Studio
  STUDIO_CREATE: 'studio.create',
  STUDIO_UPDATE: 'studio.update',
  STUDIO_DELETE: 'studio.delete',
  // Member
  MEMBER_ADD: 'member.add',
  MEMBER_ROLE_CHANGE: 'member.role_change',
  MEMBER_REMOVE: 'member.remove',
  // Invite
  INVITE_CREATE: 'invite.create',
  INVITE_ACCEPT: 'invite.accept',
  INVITE_REVOKE: 'invite.revoke',
  // Studio Verification
  STUDIO_VERIFY: 'studio.verify',
  STUDIO_UNVERIFY: 'studio.unverify',
  // Game
  GAME_CREATE: 'game.create',
  GAME_UPDATE: 'game.update',
  GAME_DELETE: 'game.delete',
  // Game Verification
  GAME_VERIFY: 'game.verify',
  GAME_UNVERIFY: 'game.unverify',
  // Game Credit
  GAME_CREDIT_ADD: 'game_credit.add',
  GAME_CREDIT_UPDATE: 'game_credit.update',
  GAME_CREDIT_REMOVE: 'game_credit.remove',
  // Change Request
  CHANGE_REQUEST_CREATE: 'change_request.create',
  CHANGE_REQUEST_APPROVE: 'change_request.approve',
  CHANGE_REQUEST_REJECT: 'change_request.reject',
  CHANGE_REQUEST_CANCEL: 'change_request.cancel',
  // Custom Domain
  CUSTOM_DOMAIN_ADD: 'custom_domain.add',
  CUSTOM_DOMAIN_VERIFY: 'custom_domain.verify',
  CUSTOM_DOMAIN_REMOVE: 'custom_domain.remove',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

export interface AuditLogEntry {
  userId: string
  userEmail?: string
  action: AuditActionType
  studioId?: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event for security tracking
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  entry: AuditLogEntry,
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      studio_id: entry.studioId || null,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    })
  } catch (error) {
    // Don't throw - audit logging should never break the main operation
    console.error('Failed to log audit event:', error)
  }
}
