/*
# Create modpacks table for Minecraft Modpack Browser

1. New Tables
- `modpacks` — stores modpack catalog data
  - id (uuid, primary key)
  - name (text, not null) — modpack name
  - slug (text, unique, not null) — URL-friendly identifier
  - description (text, not null) — short description
  - long_description (text, not null) — detailed description
  - author (text, not null) — creator/publisher
  - loader (text, not null) — mod loader (Forge, Fabric, Quilt, NeoForge)
  - minecraft_versions (text[], not null) — array of compatible MC versions
  - genres (text[], not null) — array of genre tags
  - tags (text[], not null) — array of additional tags
  - performance_impact (text, not null) — Light, Medium, Heavy, Very Heavy
  - difficulty (text, not null) — Easy, Normal, Hard, Expert
  - mod_count (int, not null) — number of mods in the pack
  - downloads (bigint, not null) — total download count
  - rating (numeric, not null) — 0-5 star rating
  - image_url (text) — thumbnail/cover image URL
  - download_url (text) — external download link
  - wiki_url (text) — wiki/documentation link
  - featured (boolean, default false) — featured on homepage
  - created_at (timestamptz)
  - updated_at (timestamptz)

2. Security
- Enable RLS on modpacks.
- Allow anon + authenticated to read (public catalog data).
- Allow anon + authenticated to insert/update/delete (open catalog management).

3. Indexes
- Index on slug for lookups
- Index on featured for homepage queries
- GIN index on minecraft_versions for array filtering
- GIN index on genres for array filtering
- Index on downloads for sorting
- Index on rating for sorting
*/

CREATE TABLE IF NOT EXISTS modpacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  long_description text NOT NULL,
  author text NOT NULL,
  loader text NOT NULL,
  minecraft_versions text[] NOT NULL DEFAULT '{}',
  genres text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  performance_impact text NOT NULL DEFAULT 'Medium',
  difficulty text NOT NULL DEFAULT 'Normal',
  mod_count int NOT NULL DEFAULT 0,
  downloads bigint NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  image_url text,
  download_url text,
  wiki_url text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE modpacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_modpacks" ON modpacks;
CREATE POLICY "anon_select_modpacks" ON modpacks FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_modpacks" ON modpacks;
CREATE POLICY "anon_insert_modpacks" ON modpacks FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_modpacks" ON modpacks;
CREATE POLICY "anon_update_modpacks" ON modpacks FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_modpacks" ON modpacks;
CREATE POLICY "anon_delete_modpacks" ON modpacks FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_modpacks_slug ON modpacks (slug);
CREATE INDEX IF NOT EXISTS idx_modpacks_featured ON modpacks (featured);
CREATE INDEX IF NOT EXISTS idx_modpacks_downloads ON modpacks (downloads DESC);
CREATE INDEX IF NOT EXISTS idx_modpacks_rating ON modpacks (rating DESC);
CREATE INDEX IF NOT EXISTS idx_modpacks_mc_versions ON modpacks USING GIN (minecraft_versions);
CREATE INDEX IF NOT EXISTS idx_modpacks_genres ON modpacks USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_modpacks_tags ON modpacks USING GIN (tags);
