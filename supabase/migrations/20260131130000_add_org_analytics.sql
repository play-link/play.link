-- ============================================================
-- Org-level Analytics RPC Functions
-- Aggregate analytics across all games in an organization
-- ============================================================

-- ============================================================
-- Indexes for analytics_events (critical for performance)
-- ============================================================

-- Composite index for org-level joins
CREATE INDEX IF NOT EXISTS idx_games_org_id
    ON public.games (owner_organization_id, id);

-- Composite index for date-range scans per game
CREATE INDEX IF NOT EXISTS idx_analytics_events_game_created
    ON public.analytics_events (game_id, created_at);

-- Partial indexes per event type for faster filtered scans
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_view
    ON public.analytics_events (game_id, created_at)
    WHERE event_type = 'page_view';

CREATE INDEX IF NOT EXISTS idx_analytics_events_link_click
    ON public.analytics_events (game_id, created_at)
    WHERE event_type = 'link_click';

CREATE INDEX IF NOT EXISTS idx_analytics_events_subscribe
    ON public.analytics_events (game_id, created_at)
    WHERE event_type = 'subscribe';

-- For unique visitor counts on page_view
CREATE INDEX IF NOT EXISTS idx_analytics_events_pv_visitor
    ON public.analytics_events (game_id, created_at, visitor_hash)
    WHERE event_type = 'page_view';

-- ============================================================
-- Summary: flat row with all card metrics in one call
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_summary(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND e.created_at >= p_from
      AND e.created_at < p_to;
$$;

-- ============================================================
-- Timeseries: daily counts with generate_series to fill gaps
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_timeseries(
    p_org_id UUID,
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
        WHERE g.owner_organization_id = p_org_id
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

-- ============================================================
-- Top games: per-game breakdown with pivoted event counts
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_top_games(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
    GROUP BY g.id, g.title
    ORDER BY link_clicks DESC
    LIMIT p_limit;
$$;

-- ============================================================
-- Top referrers across all org games (page_view only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_top_referrers(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.referrer
    ORDER BY total DESC
    LIMIT p_limit;
$$;

-- ============================================================
-- Top countries across all org games (page_view only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_top_countries(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.country
    ORDER BY total DESC
    LIMIT p_limit;
$$;

-- ============================================================
-- Top platforms: derived from link_click events + game_links.type
-- Uses LEFT JOIN to handle null link_id or deleted links
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_top_platforms(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'link_click'
    GROUP BY l.type
    ORDER BY total DESC
    LIMIT p_limit;
$$;

-- ============================================================
-- Device breakdown across all org games (page_view only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_analytics_devices(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND e.created_at >= p_from
      AND e.created_at < p_to
      AND e.event_type = 'page_view'
    GROUP BY e.device_type
    ORDER BY total DESC;
$$;
