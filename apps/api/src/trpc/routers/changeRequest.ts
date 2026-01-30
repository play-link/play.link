import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import type {OrgRoleType} from '@play/supabase-client'
import {OrgRole} from '@play/supabase-client'
import {adminProcedure, protectedProcedure, router} from '../index'
import {AuditAction, logAuditEvent} from '../lib/audit'

// Roles that can create change requests
const REQUEST_ROLES: OrgRoleType[] = [OrgRole.OWNER, OrgRole.ADMIN]

// Cooldown period for non-verified entities (24 hours in ms)
const COOLDOWN_MS = 24 * 60 * 60 * 1000

// Fields that require change requests for verified entities
const PROTECTED_FIELDS = ['slug', 'name'] as const

export const changeRequestRouter = router({
  /**
   * List change requests (for admin review)
   * TODO: Add admin role check when you have a super-admin system
   */
  list: adminProcedure
    .input(
      z.object({
        status: z
          .enum(['pending', 'approved', 'rejected', 'cancelled'])
          .optional(),
        entityType: z.enum(['organization', 'game']).optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ctx, input}) => {
      const {supabase} = ctx

      let query = supabase
        .from('change_requests')
        .select(
          `
          *,
          requester:requested_by (
            user_id,
            email,
            username,
            display_name
          ),
          reviewer:reviewed_by (
            user_id,
            email,
            username
          )
        `,
        )
        .order('created_at', {ascending: false})
        .limit(input.limit)

      if (input.status) {
        query = query.eq('status', input.status)
      }
      if (input.entityType) {
        query = query.eq('entity_type', input.entityType)
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  /**
   * Get my pending change requests
   */
  myRequests: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['organization', 'game']).optional(),
        entityId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const {user, supabase} = ctx

      let query = supabase
        .from('change_requests')
        .select('*')
        .eq('requested_by', user.id)
        .order('created_at', {ascending: false})

      if (input.entityType) {
        query = query.eq('entity_type', input.entityType)
      }
      if (input.entityId) {
        query = query.eq('entity_id', input.entityId)
      }

      const {data, error} = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data || []
    }),

  /**
   * Create a change request
   * Called when trying to change name/slug on a verified entity
   */
  create: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['organization', 'game']),
        entityId: z.string().uuid(),
        fieldName: z.enum(['slug', 'name']),
        requestedValue: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Check user has permission on this entity
      if (input.entityType === 'organization') {
        const {data: member} = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', input.entityId)
          .eq('user_id', user.id)
          .single()

        if (!member || !REQUEST_ROLES.includes(member.role as OrgRoleType)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to request changes',
          })
        }
      } else {
        // For games, check user is member of owner org
        const {data: game} = await supabase
          .from('games')
          .select('owner_organization_id')
          .eq('id', input.entityId)
          .single()

        if (!game) {
          throw new TRPCError({code: 'NOT_FOUND', message: 'Game not found'})
        }

        const {data: member} = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', game.owner_organization_id)
          .eq('user_id', user.id)
          .single()

        if (!member || !REQUEST_ROLES.includes(member.role as OrgRoleType)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to request changes',
          })
        }
      }

      // Get current value
      const table =
        input.entityType === 'organization' ? 'organizations' : 'games'
      const {data: entity} = await supabase
        .from(table)
        .select('id, slug, name')
        .eq('id', input.entityId)
        .single()

      if (!entity) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Entity not found'})
      }

      const currentValue = entity[
        input.fieldName as keyof typeof entity
      ] as string

      if (currentValue === input.requestedValue) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'New value is the same as current value',
        })
      }

      // Check for existing pending request for same field
      const {data: existingRequest} = await supabase
        .from('change_requests')
        .select('id')
        .eq('entity_type', input.entityType)
        .eq('entity_id', input.entityId)
        .eq('field_name', input.fieldName)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A pending request for this field already exists',
        })
      }

      // Create the request
      const {data: request, error} = await supabase
        .from('change_requests')
        .insert({
          requested_by: user.id,
          entity_type: input.entityType,
          entity_id: input.entityId,
          field_name: input.fieldName,
          current_value: currentValue,
          requested_value: input.requestedValue,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_CREATE,
        organizationId:
          input.entityType === 'organization' ? input.entityId : undefined,
        targetType: 'change_request',
        targetId: String(request.id),
        metadata: {
          entityType: input.entityType,
          entityId: input.entityId,
          field: input.fieldName,
          currentValue,
          requestedValue: input.requestedValue,
        },
      })

      return request
    }),

  /**
   * Cancel a pending change request (by requester)
   */
  cancel: protectedProcedure
    .input(z.object({id: z.number()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: request} = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (!request) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Request not found'})
      }

      if (request.requested_by !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own requests',
        })
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be cancelled',
        })
      }

      const {error} = await supabase
        .from('change_requests')
        .update({status: 'cancelled'})
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_CANCEL,
        organizationId:
          request.entity_type === 'organization'
            ? request.entity_id
            : undefined,
        targetType: 'change_request',
        targetId: String(input.id),
        metadata: {
          entityType: request.entity_type,
          entityId: request.entity_id,
          field: request.field_name,
        },
      })

      return {success: true}
    }),

  /**
   * Approve a change request (admin only)
   * TODO: Add proper admin role check
   */
  approve: adminProcedure
    .input(z.object({id: z.number(), notes: z.string().optional()}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      // Get the request
      const {data: request} = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (!request) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Request not found'})
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be approved',
        })
      }

      // Apply the change
      const table =
        request.entity_type === 'organization' ? 'organizations' : 'games'
      const updateField = request.field_name
      const cooldownField = `last_${request.field_name}_change`

      const {error: updateError} = await supabase
        .from(table)
        .update({
          [updateField]: request.requested_value,
          [cooldownField]: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.entity_id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      // Mark request as approved
      await supabase
        .from('change_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: input.notes || null,
        })
        .eq('id', input.id)

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_APPROVE,
        organizationId:
          request.entity_type === 'organization'
            ? request.entity_id
            : undefined,
        targetType: 'change_request',
        targetId: String(request.id),
        metadata: {
          entityType: request.entity_type,
          entityId: request.entity_id,
          field: request.field_name,
          oldValue: request.current_value,
          newValue: request.requested_value,
        },
      })

      return {success: true}
    }),

  /**
   * Reject a change request (admin only)
   */
  reject: adminProcedure
    .input(z.object({id: z.number(), notes: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      const {user, supabase} = ctx

      const {data: request} = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', input.id)
        .single()

      if (!request) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Request not found'})
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending requests can be rejected',
        })
      }

      await supabase
        .from('change_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: input.notes,
        })
        .eq('id', input.id)

      await logAuditEvent(supabase, {
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.CHANGE_REQUEST_REJECT,
        organizationId:
          request.entity_type === 'organization'
            ? request.entity_id
            : undefined,
        targetType: 'change_request',
        targetId: String(request.id),
        metadata: {
          entityType: request.entity_type,
          entityId: request.entity_id,
          field: request.field_name,
          reason: input.notes,
        },
      })

      return {success: true}
    }),
})

// Export helper for use in organization/game update endpoints
export {COOLDOWN_MS, PROTECTED_FIELDS}
