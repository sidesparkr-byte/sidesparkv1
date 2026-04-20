ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT '1.0';
