-- Game media gallery (screenshots + YouTube videos)
CREATE TABLE public.game_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    position INT DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_game_media_game ON public.game_media(game_id);

ALTER TABLE game_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON game_media FOR ALL USING (false);
