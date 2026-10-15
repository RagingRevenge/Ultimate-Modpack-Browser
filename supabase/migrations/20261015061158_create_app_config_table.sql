/*
# Create app_config table for storing edge function secrets

1. New Tables
- `app_config`
  - `key` (text, primary key) — config key name (e.g. 'curseforge_api_key')
  - `value` (text, not null) — the secret value
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `app_config`.
- NO policies for anon or authenticated roles — this table stores secrets and must only be
  accessible by the service role (which bypasses RLS). The anon-key frontend must never read this.
- The edge function uses the service role key to query this table, which bypasses RLS.
*/

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
