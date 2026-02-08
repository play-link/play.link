-- Custom Domains for Studios and Games
-- Allows studios to use their own domains for their profiles and games
-- Users must configure their own Cloudflare (free) for SSL

-- Drop existing objects if they exist (for idempotent migrations)
DROP FUNCTION IF EXISTS lookup_custom_domain(TEXT);
DROP TABLE IF EXISTS custom_domains;
DROP TYPE IF EXISTS domain_status;
DROP TYPE IF EXISTS domain_target_type;

-- Create enums for domain configuration
CREATE TYPE domain_target_type AS ENUM ('studio', 'game');
CREATE TYPE domain_status AS ENUM ('pending', 'verifying', 'verified', 'failed');

-- Create custom_domains table
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,
  target_type domain_target_type NOT NULL,
  target_id UUID NOT NULL,
  status domain_status NOT NULL DEFAULT 'pending',
  verification_token TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_custom_domains_studio_id ON custom_domains(studio_id);
CREATE INDEX idx_custom_domains_hostname ON custom_domains(hostname);
CREATE INDEX idx_custom_domains_target ON custom_domains(target_type, target_id);
CREATE INDEX idx_custom_domains_status ON custom_domains(status);

-- Add comments for documentation
COMMENT ON TABLE custom_domains IS 'Custom domains configured for studios and games';
COMMENT ON COLUMN custom_domains.studio_id IS 'The studio that owns this domain configuration';
COMMENT ON COLUMN custom_domains.hostname IS 'The custom domain hostname (e.g., celeste.game)';
COMMENT ON COLUMN custom_domains.target_type IS 'Whether this domain points to a studio or game';
COMMENT ON COLUMN custom_domains.target_id IS 'The ID of the studio or game this domain points to';
COMMENT ON COLUMN custom_domains.verification_token IS 'Token for DNS TXT verification';

-- Function to lookup a custom domain by hostname
-- Returns the target type and canonical path for routing
CREATE OR REPLACE FUNCTION lookup_custom_domain(p_hostname TEXT)
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
  FROM custom_domains cd
  WHERE cd.hostname = lower(p_hostname)
    AND cd.status = 'verified';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION lookup_custom_domain IS 'Lookup verified custom domain and return routing information';

-- Enable RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Studio members can view their studio's domains
CREATE POLICY "Studio members can view domains"
  ON custom_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM studio_members
      WHERE studio_members.studio_id = custom_domains.studio_id
        AND studio_members.user_id = auth.uid()
    )
  );

-- Only owners can insert domains
CREATE POLICY "Owners can insert domains"
  ON custom_domains FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studio_members
      WHERE studio_members.studio_id = custom_domains.studio_id
        AND studio_members.user_id = auth.uid()
        AND studio_members.role = 'OWNER'
    )
  );

-- Only owners can update domains
CREATE POLICY "Owners can update domains"
  ON custom_domains FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM studio_members
      WHERE studio_members.studio_id = custom_domains.studio_id
        AND studio_members.user_id = auth.uid()
        AND studio_members.role = 'OWNER'
    )
  );

-- Only owners can delete domains
CREATE POLICY "Owners can delete domains"
  ON custom_domains FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM studio_members
      WHERE studio_members.studio_id = custom_domains.studio_id
        AND studio_members.user_id = auth.uid()
        AND studio_members.role = 'OWNER'
    )
  );

-- Service role bypass for API operations
CREATE POLICY "Service role full access"
  ON custom_domains FOR ALL
  USING (auth.role() = 'service_role');
