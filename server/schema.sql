-- BountyTimer database schema.
--
-- v1 strategy: authenticate users, then sync the client's AppState as a JSONB
-- snapshot per user (single source of truth, cross-device). This is a deliberate
-- simplification appropriate for a solo personal tool — see KEY DECISION in
-- server/README.md. The normalized tables from PRD §8 (tasks, bank_transactions,
-- stopwatch_sessions, break_sessions) are the target for a later migration and
-- are sketched at the bottom of this file for reference.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 30),
  password_hash text NOT NULL,
  email         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Per-user application state snapshot (the client AppState shape).
CREATE TABLE IF NOT EXISTS user_state (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Monotonic version for last-write-wins conflict resolution across devices.
  version     bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FUTURE (PRD §8) — normalized model for richer server-side queries/analytics.
-- Not used by the v1 API; kept here as the migration target.
-- ---------------------------------------------------------------------------
-- CREATE TYPE task_status AS ENUM ('not_started','in_progress','paused','complete','archived');
-- CREATE TYPE task_priority AS ENUM ('high','medium','low','none');
-- CREATE TYPE txn_type AS ENUM ('credit','debit','reset');
--
-- CREATE TABLE tasks (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   title text NOT NULL,
--   estimated_mins integer NOT NULL,
--   bounty_mins integer NOT NULL,
--   priority task_priority NOT NULL DEFAULT 'none',
--   notes text,
--   status task_status NOT NULL DEFAULT 'not_started',
--   created_at timestamptz NOT NULL DEFAULT now(),
--   completed_at timestamptz
-- );
-- CREATE TABLE bank_transactions (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   type txn_type NOT NULL,
--   amount_mins integer NOT NULL,
--   task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
--   note text,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );
-- (stopwatch_sessions, break_sessions, bank_balance per PRD §8)
