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
DROP TABLE IF EXISTS game_media CASCADE;
DROP TABLE IF EXISTS game_updates CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS game_credits CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS campaign_events CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS studio_members CASCADE;
DROP TABLE IF EXISTS studios CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS page_visibility CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS studio_role CASCADE;
DROP TYPE IF EXISTS credit_role CASCADE;

-- 2. ENUMS
CREATE TYPE game_status AS ENUM ('IN_DEVELOPMENT', 'UPCOMING', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED');
CREATE TYPE page_visibility AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE studio_role AS ENUM ('OWNER', 'MEMBER', 'VIEWER');
CREATE TYPE credit_role AS ENUM ('DEVELOPER', 'PUBLISHER', 'PORTING', 'MARKETING', 'SUPPORT');
CREATE TYPE domain_target_type AS ENUM ('studio', 'game');
CREATE TYPE domain_status AS ENUM ('pending', 'verifying', 'verified', 'failed');

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

-- B. STUDIOS
CREATE TABLE public.studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    stripe_customer_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false NOT NULL,
    avatar_url TEXT,
    cover_url TEXT,
    background_color VARCHAR(20) DEFAULT '#030712',
    accent_color VARCHAR(20) DEFAULT '#818cf8',
    text_color VARCHAR(20) DEFAULT '#ffffff',
    bio TEXT,
    social_links JSONB DEFAULT '{}'::JSONB,
    last_slug_change TIMESTAMPTZ,
    last_name_change TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,

    CONSTRAINT studios_slug_key UNIQUE (slug)
);

-- C. STUDIO MEMBERS
CREATE TABLE public.studio_members (
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role studio_role DEFAULT 'MEMBER'::studio_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT studio_members_pkey PRIMARY KEY (studio_id, user_id)
);

-- D. GAMES (metadata only — public page lives in game_pages)
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,

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

    -- Verification
    is_verified BOOLEAN DEFAULT false NOT NULL,

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

    studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL,
    custom_name VARCHAR(200),
    role credit_role NOT NULL,

    CONSTRAINT check_credit_entity CHECK (studio_id IS NOT NULL OR custom_name IS NOT NULL)
);

-- F. INVITES
CREATE TABLE public.invites (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role studio_role NOT NULL,
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

    studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL,
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

    entity_type TEXT NOT NULL CHECK (entity_type IN ('studio', 'game', 'game_page')),
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
    url TEXT,
    position INT DEFAULT 0 NOT NULL,
    coming_soon BOOLEAN DEFAULT false NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- J. ANALYTICS EVENTS
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,

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
    unsubscribed_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT game_subscribers_unique UNIQUE (game_id, email)
);

-- L. CAMPAIGNS
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    destination TEXT NOT NULL DEFAULT 'game_page' CHECK (destination IN ('game_page', 'steam', 'epic', 'itch', 'custom')),
    destination_url TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(game_id, slug)
);

-- M. CAMPAIGN EVENTS
CREATE TABLE public.campaign_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    visitor_hash TEXT NOT NULL,
    country TEXT,
    city TEXT,
    device_type TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- N. GAME UPDATES
CREATE TABLE public.game_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    cta_url TEXT,
    cta_label VARCHAR(100),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    sent_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- O. GAME MEDIA
CREATE TABLE public.game_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    position INT DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- P. CUSTOM DOMAINS
CREATE TABLE public.custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL UNIQUE,
    target_type domain_target_type NOT NULL,
    target_id UUID NOT NULL,
    status domain_status NOT NULL DEFAULT 'pending',
    verification_token TEXT NOT NULL,
    cf_hostname_id TEXT,
    cf_ssl_status TEXT,
    verified_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_studio_members_user ON public.studio_members(user_id);
CREATE INDEX idx_games_owner ON public.games(owner_studio_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_genres ON public.games USING GIN (genres);
CREATE INDEX idx_game_pages_game ON public.game_pages(game_id);
CREATE INDEX idx_game_pages_visibility ON public.game_pages(visibility);
CREATE INDEX idx_game_pages_primary ON public.game_pages(game_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_game_credits_game ON public.game_credits(game_id);
CREATE INDEX idx_invites_expires ON public.invites(expires_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_studio ON public.audit_logs(studio_id);
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
CREATE INDEX idx_game_subscribers_unsubscribed ON public.game_subscribers(game_id, unsubscribed_at);
CREATE INDEX idx_game_subscribers_created ON public.game_subscribers(game_id, created_at);
CREATE INDEX idx_campaigns_game ON public.campaigns(game_id);
CREATE INDEX idx_campaign_events_campaign ON public.campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_created ON public.campaign_events(created_at);
CREATE INDEX idx_game_updates_game ON public.game_updates(game_id);
CREATE INDEX idx_game_updates_published ON public.game_updates(game_id, status, published_at DESC);
CREATE INDEX idx_game_media_game ON public.game_media(game_id);

-- Analytics performance indexes
CREATE INDEX idx_games_studio_id ON public.games (owner_studio_id, id);
CREATE INDEX idx_analytics_events_game_created ON public.analytics_events (game_id, created_at);
CREATE INDEX idx_analytics_events_page_view ON public.analytics_events (game_id, created_at) WHERE event_type = 'page_view';
CREATE INDEX idx_analytics_events_link_click ON public.analytics_events (game_id, created_at) WHERE event_type = 'link_click';
CREATE INDEX idx_analytics_events_subscribe ON public.analytics_events (game_id, created_at) WHERE event_type = 'subscribe';
CREATE INDEX idx_analytics_events_pv_visitor ON public.analytics_events (game_id, created_at, visitor_hash) WHERE event_type = 'page_view';

-- Dedup: one page_view per visitor per game per day
CREATE UNIQUE INDEX idx_analytics_events_dedup_pv
    ON public.analytics_events (game_id, visitor_hash, (date_trunc('day', created_at AT TIME ZONE 'UTC')))
    WHERE event_type = 'page_view';

-- Games verification index
CREATE INDEX idx_games_is_verified ON public.games(is_verified);

-- Custom domains indexes
CREATE INDEX idx_custom_domains_studio_id ON public.custom_domains(studio_id);
CREATE INDEX idx_custom_domains_hostname ON public.custom_domains(hostname);
CREATE INDEX idx_custom_domains_target ON public.custom_domains(target_type, target_id);
CREATE INDEX idx_custom_domains_status ON public.custom_domains(status);

-- ============================================================
-- 5. ROW LEVEL SECURITY (Zero Trust)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON profiles FOR ALL USING (false);
CREATE POLICY "No public access" ON studios FOR ALL USING (false);
CREATE POLICY "No public access" ON studio_members FOR ALL USING (false);
CREATE POLICY "No public access" ON games FOR ALL USING (false);
CREATE POLICY "No public access" ON game_pages FOR ALL USING (false);
CREATE POLICY "No public access" ON game_credits FOR ALL USING (false);
CREATE POLICY "No public access" ON invites FOR ALL USING (false);
CREATE POLICY "No public access" ON audit_logs FOR ALL USING (false);
CREATE POLICY "No public access" ON change_requests FOR ALL USING (false);
CREATE POLICY "No public access" ON game_links FOR ALL USING (false);
CREATE POLICY "No public access" ON analytics_events FOR ALL USING (false);
CREATE POLICY "No public access" ON game_subscribers FOR ALL USING (false);
CREATE POLICY "No public access" ON campaigns FOR ALL USING (false);
CREATE POLICY "No public access" ON campaign_events FOR ALL USING (false);
CREATE POLICY "Service role full access on game_updates" ON public.game_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "No public access" ON game_media FOR ALL USING (false);
CREATE POLICY "No public access" ON custom_domains FOR ALL USING (false);

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
-- 7. GAME-LEVEL ANALYTICS RPC FUNCTIONS
-- ============================================================

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

-- ============================================================
-- 8. STUDIO-LEVEL ANALYTICS RPC FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.studio_analytics_summary(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(
    page_views BIGINT,
    unique_visitors BIGINT,
    link_clicks BIGINT,
    follows BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COUNT(*) FILTER (WHERE e.event_type = 'page_view')::BIGINT AS page_views,
        COUNT(DISTINCT e.visitor_hash) FILTER (WHERE e.event_type = 'page_view')::BIGINT AS unique_visitors,
        COUNT(*) FILTER (WHERE e.event_type = 'link_click')::BIGINT AS link_clicks,
        COUNT(*) FILTER (WHERE e.event_type = 'subscribe')::BIGINT AS follows
    FROM public.analytics_events e
    JOIN public.games g ON g.id = e.game_id
    WHERE g.owner_studio_id = p_studio_id
      AND e.created_at >= p_from
      AND e.created_at < p_to;
$$;

CREATE OR REPLACE FUNCTION public.studio_analytics_timeseries(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(day DATE, page_views BIGINT, link_clicks BIGINT, follows BIGINT)
LANGUAGE sql STABLE
AS $$
    WITH days AS (
        SELECT d::DATE AS day
        FROM generate_series(p_from::DATE, (p_to - INTERVAL '1 day')::DATE, '1 day') AS d
    ),
    daily AS (
        SELECT
            date_trunc('day', e.created_at)::DATE AS day,
            COUNT(*) FILTER (WHERE e.event_type = 'page_view')::BIGINT AS page_views,
            COUNT(*) FILTER (WHERE e.event_type = 'link_click')::BIGINT AS link_clicks,
            COUNT(*) FILTER (WHERE e.event_type = 'subscribe')::BIGINT AS follows
        FROM public.analytics_events e
        JOIN public.games g ON g.id = e.game_id
        WHERE g.owner_studio_id = p_studio_id
          AND e.created_at >= p_from
          AND e.created_at < p_to
        GROUP BY 1
    )
    SELECT
        days.day,
        COALESCE(daily.page_views, 0)::BIGINT AS page_views,
        COALESCE(daily.link_clicks, 0)::BIGINT AS link_clicks,
        COALESCE(daily.follows, 0)::BIGINT AS follows
    FROM days
    LEFT JOIN daily ON daily.day = days.day
    ORDER BY days.day;
$$;

CREATE OR REPLACE FUNCTION public.studio_analytics_top_games(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 20
)
RETURNS TABLE(game_id UUID, title TEXT, page_views BIGINT, link_clicks BIGINT, follows BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        g.id AS game_id,
        g.title,
        COUNT(*) FILTER (WHERE e.event_type = 'page_view')::BIGINT AS page_views,
        COUNT(*) FILTER (WHERE e.event_type = 'link_click')::BIGINT AS link_clicks,
        COUNT(*) FILTER (WHERE e.event_type = 'subscribe')::BIGINT AS follows
    FROM public.analytics_events e
    JOIN public.games g ON g.id = e.game_id
    WHERE g.owner_studio_id = p_studio_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
    GROUP BY g.id, g.title
    ORDER BY link_clicks DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.studio_analytics_top_referrers(
    p_studio_id UUID,
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
    JOIN public.games g ON g.id = e.game_id
    WHERE g.owner_studio_id = p_studio_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.referrer
    ORDER BY total DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.studio_analytics_top_countries(
    p_studio_id UUID,
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
    JOIN public.games g ON g.id = e.game_id
    WHERE g.owner_studio_id = p_studio_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.country
    ORDER BY total DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.studio_analytics_top_platforms(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(platform TEXT, total BIGINT)
LANGUAGE sql STABLE
AS $$
    SELECT
        COALESCE(l.type, 'unknown') AS platform,
        COUNT(*)::BIGINT AS total
    FROM public.analytics_events e
    JOIN public.games g ON g.id = e.game_id
    LEFT JOIN public.game_links l ON l.id = e.link_id
    WHERE g.owner_studio_id = p_studio_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'link_click'
    GROUP BY l.type
    ORDER BY total DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.studio_analytics_devices(
    p_studio_id UUID,
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
    JOIN public.games g ON g.id = e.game_id
    WHERE g.owner_studio_id = p_studio_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.device_type
    ORDER BY total DESC;
$$;

-- ============================================================
-- 9. CAMPAIGN RPC FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION campaign_summary(
    p_campaign_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(total_clicks BIGINT, unique_visitors BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_clicks,
        COUNT(DISTINCT visitor_hash)::BIGINT AS unique_visitors
    FROM campaign_events
    WHERE campaign_id = p_campaign_id
      AND created_at >= p_from
      AND created_at <= p_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION campaign_timeseries(
    p_campaign_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(day DATE, total_clicks BIGINT, unique_visitors BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        created_at::DATE AS day,
        COUNT(*)::BIGINT AS total_clicks,
        COUNT(DISTINCT visitor_hash)::BIGINT AS unique_visitors
    FROM campaign_events
    WHERE campaign_id = p_campaign_id
      AND created_at >= p_from
      AND created_at <= p_to
    GROUP BY created_at::DATE
    ORDER BY day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION campaign_top_referrers(
    p_campaign_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(referrer TEXT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ce.referrer, 'Direct') AS referrer,
        COUNT(*)::BIGINT AS total
    FROM campaign_events ce
    WHERE ce.campaign_id = p_campaign_id
      AND ce.created_at >= p_from
      AND ce.created_at <= p_to
    GROUP BY COALESCE(ce.referrer, 'Direct')
    ORDER BY total DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION campaign_top_countries(
    p_campaign_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(country TEXT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ce.country, 'Unknown') AS country,
        COUNT(*)::BIGINT AS total
    FROM campaign_events ce
    WHERE ce.campaign_id = p_campaign_id
      AND ce.created_at >= p_from
      AND ce.created_at <= p_to
    GROUP BY COALESCE(ce.country, 'Unknown')
    ORDER BY total DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. AUDIENCE RPC FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.audience_summary(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_game_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_subscribers BIGINT,
    subscribers_gained BIGINT,
    unsubscribes BIGINT,
    net_growth BIGINT,
    confirmed_count BIGINT,
    pending_count BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COUNT(*) FILTER (WHERE gs.unsubscribed_at IS NULL)::BIGINT
            AS total_subscribers,
        COUNT(*) FILTER (WHERE gs.created_at >= p_from AND gs.created_at < p_to)::BIGINT
            AS subscribers_gained,
        COUNT(*) FILTER (WHERE gs.unsubscribed_at >= p_from AND gs.unsubscribed_at < p_to)::BIGINT
            AS unsubscribes,
        (COUNT(*) FILTER (WHERE gs.created_at >= p_from AND gs.created_at < p_to)
         - COUNT(*) FILTER (WHERE gs.unsubscribed_at >= p_from AND gs.unsubscribed_at < p_to))::BIGINT
            AS net_growth,
        COUNT(*) FILTER (WHERE gs.confirmed = true AND gs.unsubscribed_at IS NULL)::BIGINT
            AS confirmed_count,
        COUNT(*) FILTER (WHERE gs.confirmed = false AND gs.unsubscribed_at IS NULL)::BIGINT
            AS pending_count
    FROM public.game_subscribers gs
    JOIN public.games g ON g.id = gs.game_id
    WHERE g.owner_studio_id = p_studio_id
      AND (p_game_id IS NULL OR gs.game_id = p_game_id);
$$;

CREATE OR REPLACE FUNCTION public.audience_timeseries(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ,
    p_game_id UUID DEFAULT NULL
)
RETURNS TABLE(
    day DATE,
    subscribers_gained BIGINT,
    unsubscribes BIGINT,
    net_growth BIGINT
)
LANGUAGE sql STABLE
AS $$
    WITH days AS (
        SELECT d::DATE AS day
        FROM generate_series(p_from::DATE, (p_to - INTERVAL '1 day')::DATE, '1 day') AS d
    ),
    daily_gained AS (
        SELECT
            date_trunc('day', gs.created_at)::DATE AS day,
            COUNT(*)::BIGINT AS gained
        FROM public.game_subscribers gs
        JOIN public.games g ON g.id = gs.game_id
        WHERE g.owner_studio_id = p_studio_id
          AND (p_game_id IS NULL OR gs.game_id = p_game_id)
          AND gs.created_at >= p_from
          AND gs.created_at < p_to
        GROUP BY 1
    ),
    daily_unsubs AS (
        SELECT
            date_trunc('day', gs.unsubscribed_at)::DATE AS day,
            COUNT(*)::BIGINT AS unsubs
        FROM public.game_subscribers gs
        JOIN public.games g ON g.id = gs.game_id
        WHERE g.owner_studio_id = p_studio_id
          AND (p_game_id IS NULL OR gs.game_id = p_game_id)
          AND gs.unsubscribed_at >= p_from
          AND gs.unsubscribed_at < p_to
        GROUP BY 1
    )
    SELECT
        days.day,
        COALESCE(dg.gained, 0)::BIGINT AS subscribers_gained,
        COALESCE(du.unsubs, 0)::BIGINT AS unsubscribes,
        (COALESCE(dg.gained, 0) - COALESCE(du.unsubs, 0))::BIGINT AS net_growth
    FROM days
    LEFT JOIN daily_gained dg ON dg.day = days.day
    LEFT JOIN daily_unsubs du ON du.day = days.day
    ORDER BY days.day;
$$;

CREATE OR REPLACE FUNCTION public.audience_by_game(
    p_studio_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS TABLE(
    game_id UUID,
    game_title TEXT,
    cover_url TEXT,
    total_subscribers BIGINT,
    subscribers_gained BIGINT,
    unsubscribes BIGINT,
    net_growth BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        g.id AS game_id,
        g.title AS game_title,
        g.cover_url,
        COUNT(*) FILTER (WHERE gs.unsubscribed_at IS NULL)::BIGINT
            AS total_subscribers,
        COUNT(*) FILTER (WHERE gs.created_at >= p_from AND gs.created_at < p_to)::BIGINT
            AS subscribers_gained,
        COUNT(*) FILTER (WHERE gs.unsubscribed_at >= p_from AND gs.unsubscribed_at < p_to)::BIGINT
            AS unsubscribes,
        (COUNT(*) FILTER (WHERE gs.created_at >= p_from AND gs.created_at < p_to)
         - COUNT(*) FILTER (WHERE gs.unsubscribed_at >= p_from AND gs.unsubscribed_at < p_to))::BIGINT
            AS net_growth
    FROM public.games g
    LEFT JOIN public.game_subscribers gs ON gs.game_id = g.id
    WHERE g.owner_studio_id = p_studio_id
    GROUP BY g.id, g.title, g.cover_url
    HAVING COUNT(gs.id) > 0
    ORDER BY
        COUNT(*) FILTER (WHERE gs.created_at >= p_from AND gs.created_at < p_to) DESC,
        COUNT(*) FILTER (WHERE gs.unsubscribed_at IS NULL) DESC;
$$;

-- ============================================================
-- 11. CUSTOM DOMAIN FUNCTIONS
-- ============================================================

-- Function to lookup a custom domain by hostname
CREATE OR REPLACE FUNCTION public.lookup_custom_domain(p_hostname TEXT)
RETURNS TABLE (
    target_type domain_target_type,
    target_id UUID,
    canonical_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.target_type,
        cd.target_id,
        CASE
            WHEN cd.target_type = 'studio' THEN
                '@' || (SELECT slug FROM studios WHERE id = cd.target_id)
            WHEN cd.target_type = 'game' THEN
                (SELECT gp.slug FROM game_pages gp WHERE gp.game_id = cd.target_id AND gp.is_primary = true LIMIT 1)
        END AS canonical_path
    FROM public.custom_domains cd
    WHERE cd.hostname = lower(p_hostname)
      AND cd.status = 'verified';
END;
$$ LANGUAGE plpgsql STABLE;
