-- =========================================================================
-- MIGRATION: Security Improvements
-- - Add expires_at to invites
-- - Create audit_logs table
-- =========================================================================

-- 1. ADD EXPIRES_AT TO INVITES
-- Default: 7 days from creation
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days') NOT NULL;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_invites_expires ON public.invites(expires_at);

-- 2. AUDIT LOGS TABLE
-- Track important actions for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Who performed the action
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    user_email TEXT, -- Store email in case user is deleted
    
    -- What action was performed
    action TEXT NOT NULL, -- e.g., 'organization.delete', 'member.role_change', 'invite.create'
    
    -- Context
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    target_type TEXT, -- e.g., 'organization', 'member', 'game', 'invite'
    target_id TEXT, -- ID of the affected entity
    
    -- Details
    metadata JSONB DEFAULT '{}'::JSONB, -- Additional context (old_role, new_role, etc.)
    ip_address INET, -- For security auditing
    user_agent TEXT, -- Browser/client info
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON public.audit_logs FOR ALL USING (false);

-- 3. FUNCTION TO CLEANUP EXPIRED INVITES
-- Call this periodically via pg_cron or from your backend
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.invites WHERE expires_at < now();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
