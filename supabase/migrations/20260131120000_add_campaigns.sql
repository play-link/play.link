-- Campaigns: tracked marketing links for games
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

CREATE INDEX idx_campaigns_game ON public.campaigns(game_id);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON campaigns FOR ALL USING (false);

-- Campaign click events
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

CREATE INDEX idx_campaign_events_campaign ON public.campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_created ON public.campaign_events(created_at);
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON campaign_events FOR ALL USING (false);

-- RPC: campaign summary (total clicks + unique visitors)
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

-- RPC: campaign timeseries (daily clicks)
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

-- RPC: campaign top referrers
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

-- RPC: campaign top countries
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
