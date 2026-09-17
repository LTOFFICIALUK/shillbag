-- SHILLBAG · Railway Postgres
-- Applied on API boot (IF NOT EXISTS) and by local docker-compose.

CREATE TABLE IF NOT EXISTS sessions (
  address TEXT PRIMARY KEY,
  holdings_approved_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS challenges (
  address TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS x_links (
  address TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  user_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  follows_us BOOLEAN NOT NULL DEFAULT FALSE,
  follows_checked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS x_links_user_id_idx ON x_links (user_id);

CREATE TABLE IF NOT EXISTS claims (
  tweet_id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  username TEXT NOT NULL,
  payout_usd NUMERIC(18, 8) NOT NULL,
  assets JSONB NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'sent', 'skipped')),
  tx_signature TEXT,
  payout_error TEXT
);

ALTER TABLE claims ADD COLUMN IF NOT EXISTS tx_signature TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS payout_error TEXT;

CREATE INDEX IF NOT EXISTS claims_address_idx ON claims (address, claimed_at DESC);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  username TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL,
  pages_fetched INTEGER NOT NULL,
  tweets_looked INTEGER NOT NULL,
  paid_usd NUMERIC(18, 8) NOT NULL,
  lookback_label TEXT NOT NULL,
  tier_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scans_at_idx ON scans (at DESC);

CREATE TABLE IF NOT EXISTS daily_spend (
  address TEXT NOT NULL,
  day DATE NOT NULL,
  paid_usd NUMERIC(18, 8) NOT NULL DEFAULT 0,
  PRIMARY KEY (address, day)
);

CREATE TABLE IF NOT EXISTS last_scans (
  address TEXT PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS scan_coverage (
  address TEXT PRIMARY KEY,
  tier_id TEXT NOT NULL,
  covered_from TIMESTAMPTZ NOT NULL,
  covered_to TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_attempts_ip_at_idx
  ON admin_attempts (ip, attempted_at DESC);
