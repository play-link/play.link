import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {DomainStatus, DomainTargetType, StudioRole} from '@play/supabase-client'
import {protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'
import {verifyGameAccess} from '../lib/verify-access'

// Generate a random verification token
function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'playlink-verify-'
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Hostname validation: must be a valid domain
const hostnameSchema = z
  .string()
  .min(4)
  .max(253)
  .regex(
    /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+(?<!-)$/i,
    'Must be a valid domain (e.g., example.com)',
  )
  .transform((h) => h.toLowerCase())

export const customDomainRouter = router({
  /**
   * List custom domains for a studio
   */
  list: protectedProcedure
    .input(z.object({studioId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is member of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this studio',
        })
      }

      const {data: domains, error} = await supabase
        .from('custom_domains')
        .select('*')
        .eq('studio_id', input.studioId)
        .order('created_at', {ascending: false})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return domains || []
    }),

  /**
   * List custom domains for a specific game
   */
  listByGame: protectedProcedure
    .input(z.object({gameId: z.string().uuid()}))
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx
      await verifyGameAccess(supabase, user.id, input.gameId)

      const {data: domains, error} = await supabase
        .from('custom_domains')
        .select('*')
        .eq('target_type', DomainTargetType.GAME)
        .eq('target_id', input.gameId)
        .order('created_at', {ascending: false})

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return domains || []
    }),

  /**
   * Add a new custom domain
   */
  add: protectedProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        hostname: hostnameSchema,
        targetType: z.enum([DomainTargetType.STUDIO, DomainTargetType.GAME]),
        targetId: z.string().uuid(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user is OWNER of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', input.studioId)
        .eq('user_id', user.id)
        .single()

      if (!member || member.role !== StudioRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only studio owners can add custom domains',
        })
      }

      // Validate target exists and belongs to studio
      if (input.targetType === DomainTargetType.STUDIO) {
        if (input.targetId !== input.studioId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Studio target must match the studio ID',
          })
        }
      } else if (input.targetType === DomainTargetType.GAME) {
        const {data: game} = await supabase
          .from('games')
          .select('owner_studio_id')
          .eq('id', input.targetId)
          .single()

        if (!game || game.owner_studio_id !== input.studioId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Game must belong to this studio',
          })
        }
      }

      // Check hostname isn't already taken
      const {data: existing} = await supabase
        .from('custom_domains')
        .select('id')
        .eq('hostname', input.hostname)
        .maybeSingle()

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This domain is already registered',
        })
      }

      const verificationToken = generateVerificationToken()

      const {data: domain, error} = await supabase
        .from('custom_domains')
        .insert({
          studio_id: input.studioId,
          hostname: input.hostname,
          target_type: input.targetType,
          target_id: input.targetId,
          status: DomainStatus.PENDING,
          verification_token: verificationToken,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This domain is already registered',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CUSTOM_DOMAIN_ADD,
        studioId: input.studioId,
        targetType: 'custom_domain',
        targetId: domain.id,
        metadata: {
          hostname: input.hostname,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      })

      return domain
    }),

  /**
   * Verify DNS configuration (TXT record only, no Cloudflare integration)
   * User must configure their own Cloudflare/CDN for SSL
   */
  verify: protectedProcedure
    .input(z.object({domainId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get domain
      const {data: domain, error: domainError} = await supabase
        .from('custom_domains')
        .select('*')
        .eq('id', input.domainId)
        .single()

      if (domainError || !domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        })
      }

      // Check user is OWNER of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', domain.studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || member.role !== StudioRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only studio owners can verify domains',
        })
      }

      // Update status to verifying
      await supabase
        .from('custom_domains')
        .update({status: DomainStatus.VERIFYING, updated_at: new Date().toISOString()})
        .eq('id', input.domainId)

      // Verify DNS TXT record
      const txtHost = `_playlink-verification.${domain.hostname}`
      let dnsVerified = false
      let dnsError: string | null = null

      try {
        const response = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(txtHost)}&type=TXT`,
        )
        const dnsData = (await response.json()) as {
          Answer?: Array<{data: string}>
        }

        if (dnsData.Answer) {
          for (const record of dnsData.Answer) {
            // TXT records come quoted
            const value = record.data.replace(/^"|"$/g, '')
            if (value === domain.verification_token) {
              dnsVerified = true
              break
            }
          }
        }

        if (!dnsVerified) {
          dnsError = 'TXT record not found or incorrect value. Make sure DNS has propagated (can take up to 48h).'
        }
      } catch {
        dnsError = 'Failed to query DNS. Please try again.'
      }

      if (!dnsVerified) {
        await supabase
          .from('custom_domains')
          .update({
            status: DomainStatus.FAILED,
            error: dnsError,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.domainId)

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: dnsError || 'DNS verification failed',
        })
      }

      // Update domain as verified
      const {data: updatedDomain, error: updateError} = await supabase
        .from('custom_domains')
        .update({
          status: DomainStatus.VERIFIED,
          verified_at: new Date().toISOString(),
          error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.domainId)
        .select()
        .single()

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CUSTOM_DOMAIN_VERIFY,
        studioId: domain.studio_id,
        targetType: 'custom_domain',
        targetId: domain.id,
        metadata: {hostname: domain.hostname},
      })

      return updatedDomain
    }),

  /**
   * Remove a custom domain
   */
  remove: protectedProcedure
    .input(z.object({domainId: z.string().uuid()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get domain
      const {data: domain, error: domainError} = await supabase
        .from('custom_domains')
        .select('*')
        .eq('id', input.domainId)
        .single()

      if (domainError || !domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        })
      }

      // Check user is OWNER of studio
      const {data: member} = await supabase
        .from('studio_members')
        .select('role')
        .eq('studio_id', domain.studio_id)
        .eq('user_id', user.id)
        .single()

      if (!member || member.role !== StudioRole.OWNER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only studio owners can remove domains',
        })
      }

      // Delete from database
      const {error} = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', input.domainId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CUSTOM_DOMAIN_REMOVE,
        studioId: domain.studio_id,
        targetType: 'custom_domain',
        targetId: domain.id,
        metadata: {hostname: domain.hostname},
      })

      return {success: true}
    }),
})
