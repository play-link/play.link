-- 1. Deduplicate page_view events: one per visitor per game per day
--    This prevents inflated page view counts from repeated visits/refreshes.
--    Link clicks and subscribes remain unconstrained.
-- Use date_trunc at UTC to get an immutable day boundary for dedup
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_events_dedup_pv
    ON public.analytics_events (game_id, visitor_hash, (date_trunc('day', created_at AT TIME ZONE 'UTC')))
    WHERE event_type = 'page_view';

-- 2. Change analytics_events.game_id FK from CASCADE to SET NULL on game delete.
--    This preserves historical analytics data when a game is removed.
ALTER TABLE public.analytics_events
    ALTER COLUMN game_id DROP NOT NULL;

ALTER TABLE public.analytics_events
    DROP CONSTRAINT analytics_events_game_id_fkey;

ALTER TABLE public.analytics_events
    ADD CONSTRAINT analytics_events_game_id_fkey
    FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL;
