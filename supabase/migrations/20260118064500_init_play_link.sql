/* -----------------------------------------------------------------------
  MASTER MIGRATION: PLAY.LINK
  Stack: Hono + tRPC + Supabase (Service Role Architecture)
  ----------------------------------------------------------------------- */

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- LIMPIEZA PREVIA
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS game_links CASCADE;
DROP TABLE IF EXISTS game_subscribers CASCADE;
DROP TABLE IF EXISTS game_pages CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS game_credits CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS page_visibility CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS org_role CASCADE;
DROP TYPE IF EXISTS credit_role CASCADE;

-- 2. ENUMS
CREATE TYPE game_status AS ENUM ('IN_DEVELOPMENT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED');
CREATE TYPE page_visibility AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE org_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE credit_role AS ENUM ('DEVELOPER', 'PUBLISHER', 'PORTING', 'MARKETING', 'SUPPORT');

-- ============================================================
-- 3. TABLAS PRINCIPALES
-- ============================================================

-- A. PROFILES
CREATE TABLE public.profiles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
    CONSTRAINT profiles_username_key UNIQUE (username)
);

-- B. ORGANIZATIONS
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    stripe_customer_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false NOT NULL,
    avatar_url TEXT,
    website_url TEXT,
    last_slug_change TIMESTAMPTZ,
    last_name_change TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT organizations_slug_key UNIQUE (slug)
);

-- C. ORGANIZATION MEMBERS
CREATE TABLE public.organization_members (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role org_role DEFAULT 'MEMBER'::org_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT organization_members_pkey PRIMARY KEY (organization_id, user_id)
);

-- D. GAMES (metadata only — public page lives in game_pages)
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    summary TEXT,
    description JSONB,

    -- Lifecycle
    status game_status DEFAULT 'IN_DEVELOPMENT'::game_status NOT NULL,
    release_date TIMESTAMPTZ,
    genres TEXT[] DEFAULT '{}'::TEXT[],

    -- Assets
    cover_url TEXT,
    header_url TEXT,
    trailer_url TEXT,
    theme_color VARCHAR(20),

    -- Technical
    platforms JSONB DEFAULT '[]'::JSONB,

    -- Change request cooldowns
    last_name_change TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ
);

-- D2. GAME PAGES (public-facing page with slug and visibility)
CREATE TABLE public.game_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    slug VARCHAR(150) NOT NULL,
    visibility page_visibility DEFAULT 'DRAFT'::page_visibility NOT NULL,

    published_at TIMESTAMPTZ,
    unpublished_at TIMESTAMPTZ,

    is_primary BOOLEAN DEFAULT true NOT NULL,

    page_config JSONB NOT NULL DEFAULT '{}'::JSONB,

    last_slug_change TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT game_pages_slug_key UNIQUE (slug),
    CONSTRAINT check_published_at CHECK (
        (visibility = 'PUBLISHED' AND published_at IS NOT NULL)
        OR (visibility <> 'PUBLISHED')
    )
);

-- E. GAME CREDITS
CREATE TABLE public.game_credits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    custom_name VARCHAR(200),
    role credit_role NOT NULL,

    CONSTRAINT check_credit_entity CHECK (organization_id IS NOT NULL OR custom_name IS NOT NULL)
);

-- F. INVITES
CREATE TABLE public.invites (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role org_role NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days') NOT NULL
);

-- G. AUDIT LOGS
CREATE TABLE public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    user_email TEXT,

    action TEXT NOT NULL,

    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    target_type TEXT,
    target_id TEXT,

    metadata JSONB DEFAULT '{}'::JSONB,
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- H. CHANGE REQUESTS
CREATE TABLE public.change_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    requested_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,

    entity_type TEXT NOT NULL CHECK (entity_type IN ('organization', 'game', 'game_page')),
    entity_id UUID NOT NULL,

    field_name TEXT NOT NULL CHECK (field_name IN ('slug', 'name')),
    current_value TEXT NOT NULL,
    requested_value TEXT NOT NULL,

    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reason TEXT,

    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- I. GAME LINKS
CREATE TABLE public.game_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    category TEXT NOT NULL,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    position INT DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- J. ANALYTICS EVENTS
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    event_type TEXT NOT NULL,
    link_id UUID REFERENCES public.game_links(id) ON DELETE SET NULL,
    user_id UUID,

    visitor_hash TEXT NOT NULL,
    country TEXT,
    city TEXT,
    device_type TEXT,
    referrer TEXT,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- K. GAME SUBSCRIBERS
CREATE TABLE public.game_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    email TEXT NOT NULL,
    confirmed BOOLEAN DEFAULT false NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT game_subscribers_unique UNIQUE (game_id, email)
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_games_owner ON public.games(owner_organization_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_genres ON public.games USING GIN (genres);
CREATE INDEX idx_game_pages_game ON public.game_pages(game_id);
CREATE INDEX idx_game_pages_visibility ON public.game_pages(visibility);
CREATE INDEX idx_game_pages_primary ON public.game_pages(game_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_game_credits_game ON public.game_credits(game_id);
CREATE INDEX idx_invites_expires ON public.invites(expires_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_change_requests_entity ON public.change_requests(entity_type, entity_id);
CREATE INDEX idx_change_requests_status ON public.change_requests(status);
CREATE INDEX idx_change_requests_status_created ON public.change_requests(status, created_at DESC);
CREATE INDEX idx_change_requests_requested_by ON public.change_requests(requested_by);
CREATE INDEX idx_game_links_game ON public.game_links(game_id);
CREATE INDEX idx_analytics_events_game ON public.analytics_events(game_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_link ON public.analytics_events(link_id);
CREATE INDEX idx_game_subscribers_game ON public.game_subscribers(game_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY (Zero Trust)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON profiles FOR ALL USING (false);
CREATE POLICY "No public access" ON organizations FOR ALL USING (false);
CREATE POLICY "No public access" ON organization_members FOR ALL USING (false);
CREATE POLICY "No public access" ON games FOR ALL USING (false);
CREATE POLICY "No public access" ON game_pages FOR ALL USING (false);
CREATE POLICY "No public access" ON game_credits FOR ALL USING (false);
CREATE POLICY "No public access" ON invites FOR ALL USING (false);
CREATE POLICY "No public access" ON audit_logs FOR ALL USING (false);
CREATE POLICY "No public access" ON change_requests FOR ALL USING (false);
CREATE POLICY "No public access" ON game_links FOR ALL USING (false);
CREATE POLICY "No public access" ON analytics_events FOR ALL USING (false);
CREATE POLICY "No public access" ON game_subscribers FOR ALL USING (false);

-- ============================================================
-- 6. FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_val TEXT;
BEGIN
  username_val := SPLIT_PART(NEW.email, '@', 1);
  username_val := regexp_replace(username_val, '[^a-zA-Z0-9_-]', '', 'g');

  IF length(username_val) < 3 OR EXISTS (SELECT 1 FROM public.profiles WHERE username = username_val) THEN
    username_val := username_val || floor(random() * 10000)::text;
  END IF;

  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, username_val);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Cleanup expired invites
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

-- ============================================================
-- 7. ANALYTICS RPC FUNCTIONS
-- ============================================================

-- Summary: totals per event_type
CREATE OR REPLACE FUNCTION public.analytics_summary(
    p_game_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(event_type TEXT, total BIGINT, unique_visitors BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        e.event_type,
        COUNT(*)::BIGINT AS total,
        COUNT(DISTINCT e.visitor_hash)::BIGINT AS unique_visitors
    FROM public.analytics_events e
    WHERE e.game_id = p_game_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
    GROUP BY e.event_type;
$$;

-- Timeseries: daily counts per event_type
CREATE OR REPLACE FUNCTION public.analytics_timeseries(
    p_game_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(day DATE, event_type TEXT, total BIGINT, unique_visitors BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        date_trunc('day', e.created_at)::DATE AS day,
        e.event_type,
        COUNT(*)::BIGINT AS total,
        COUNT(DISTINCT e.visitor_hash)::BIGINT AS unique_visitors
    FROM public.analytics_events e
    WHERE e.game_id = p_game_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
    GROUP BY day, e.event_type
    ORDER BY day;
$$;

-- Top referrers
CREATE OR REPLACE FUNCTION public.analytics_top_referrers(
    p_game_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(referrer TEXT, total BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        COALESCE(e.referrer, 'Direct') AS referrer,
        COUNT(*)::BIGINT AS total
    FROM public.analytics_events e
    WHERE e.game_id = p_game_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.referrer
    ORDER BY total DESC
    LIMIT p_limit;
$$;

-- Top countries
CREATE OR REPLACE FUNCTION public.analytics_top_countries(
    p_game_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(country TEXT, total BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        COALESCE(e.country, 'Unknown') AS country,
        COUNT(*)::BIGINT AS total
    FROM public.analytics_events e
    WHERE e.game_id = p_game_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.country
    ORDER BY total DESC
    LIMIT p_limit;
$$;

-- Top links (clicked)
CREATE OR REPLACE FUNCTION public.analytics_top_links(
    p_game_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(link_id UUID, label TEXT, url TEXT, total BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        e.link_id,
        l.label,
        l.url,
        COUNT(*)::BIGINT AS total
    FROM public.analytics_events e
    JOIN public.game_links l ON l.id = e.link_id
    WHERE e.game_id = p_game_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'link_click'
    GROUP BY e.link_id, l.label, l.url
    ORDER BY total DESC
    LIMIT p_limit;
$$;

-- Device breakdown
CREATE OR REPLACE FUNCTION public.analytics_devices(
    p_game_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(device_type TEXT, total BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        COALESCE(e.device_type, 'unknown') AS device_type,
        COUNT(*)::BIGINT AS total
    FROM public.analytics_events e
    WHERE e.game_id = p_game_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.device_type
    ORDER BY total DESC;
$$;
