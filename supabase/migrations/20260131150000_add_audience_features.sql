-- ============================================================
-- Audience Feature: Schema changes + RPC functions
-- ============================================================

-- Add unsubscribed_at column for tracking unsubscribes
ALTER TABLE public.game_subscribers
    ADD COLUMN unsubscribed_at TIMESTAMPTZ DEFAULT NULL;

-- Indexes for audience queries
CREATE INDEX IF NOT EXISTS idx_game_subscribers_unsubscribed
    ON public.game_subscribers (game_id, unsubscribed_at);

CREATE INDEX IF NOT EXISTS idx_game_subscribers_created
    ON public.game_subscribers (game_id, created_at);

-- ============================================================
-- Audience Summary: flat row with all card metrics
-- Optional p_game_id filter (NULL = all games in org)
-- ============================================================

CREATE OR REPLACE FUNCTION public.audience_summary(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
      AND (p_game_id IS NULL OR gs.game_id = p_game_id);
$$;

-- ============================================================
-- Audience Timeseries: daily counts with generate_series gap-fill
-- ============================================================

CREATE OR REPLACE FUNCTION public.audience_timeseries(
    p_org_id UUID,
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
        WHERE g.owner_organization_id = p_org_id
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
        WHERE g.owner_organization_id = p_org_id
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

-- ============================================================
-- Audience By Game: per-game breakdown (always org-wide)
-- ============================================================

CREATE OR REPLACE FUNCTION public.audience_by_game(
    p_org_id UUID,
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
    WHERE g.owner_organization_id = p_org_id
    GROUP BY g.id, g.title, g.cover_url
    HAVING COUNT(gs.id) > 0
    ORDER BY
        COUNT(*) FILTER (WHERE gs.created_at >= p_from AND gs.created_at < p_to) DESC,
        COUNT(*) FILTER (WHERE gs.unsubscribed_at IS NULL) DESC;
$$;
