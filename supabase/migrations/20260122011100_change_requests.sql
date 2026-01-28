-- =========================================================================
-- MIGRATION: Change Request System
-- For managing slug/name changes on verified organizations and games
-- =========================================================================

-- 1. CHANGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.change_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Who requested the change
    requested_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    
    -- What entity is being changed
    entity_type TEXT NOT NULL CHECK (entity_type IN ('organization', 'game')),
    entity_id UUID NOT NULL,
    
    -- What field is being changed
    field_name TEXT NOT NULL CHECK (field_name IN ('slug', 'name')),
    current_value TEXT NOT NULL,
    requested_value TEXT NOT NULL,
    
    -- Request status
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reason TEXT, -- Why the user wants this change

    -- Review info
    reviewer_notes TEXT, -- Reason for rejection or approval notes
    reviewed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_change_requests_entity ON public.change_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON public.change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_status_created ON public.change_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_requests_requested_by ON public.change_requests(requested_by);

-- 3. RLS
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON public.change_requests FOR ALL USING (false);

-- 4. ADD last_slug_change COLUMNS FOR COOLDOWN TRACKING
-- For non-verified entities, we still want a cooldown
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS last_slug_change TIMESTAMPTZ;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS last_name_change TIMESTAMPTZ;

ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS last_slug_change TIMESTAMPTZ;

ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS last_name_change TIMESTAMPTZ;
