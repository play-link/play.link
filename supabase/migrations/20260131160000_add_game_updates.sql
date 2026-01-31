-- Game Updates table
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

-- Indexes
CREATE INDEX idx_game_updates_game ON public.game_updates(game_id);
CREATE INDEX idx_game_updates_published ON public.game_updates(game_id, status, published_at DESC);

-- Enable RLS
ALTER TABLE public.game_updates ENABLE ROW LEVEL SECURITY;

-- RLS: service role can do everything (API uses service role)
CREATE POLICY "Service role full access on game_updates"
    ON public.game_updates
    FOR ALL
    USING (true)
    WITH CHECK (true);
