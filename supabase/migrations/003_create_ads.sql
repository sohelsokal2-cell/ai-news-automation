-- Ads management: placements shown on the public site, managed from /admin/ads.
CREATE TABLE IF NOT EXISTS ads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slot text NOT NULL DEFAULT 'sidebar',
  image_url text,
  link_url text,
  html text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ads_slot_idx ON ads (slot);
