-- ============================================================
-- TIKKIT — Identity/Payment Verification + Chat + Ledger
-- Migration: 20260319_verification_and_purge
-- ============================================================

-- ── 1. Verification columns on profiles ──────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_id_verified        BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_payment_verified   BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS didit_verification_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_token  TEXT,
  ADD COLUMN IF NOT EXISTS social_score          INTEGER   NOT NULL DEFAULT 0;

-- ── 2. verification_sessions ─────────────────────────────────────
-- Tracks in-progress Didit + Stripe sessions before webhook confirmation
CREATE TABLE IF NOT EXISTS verification_sessions (
  id                           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  didit_session_id             TEXT        UNIQUE,
  stripe_payment_intent_id     TEXT        UNIQUE,
  status                       TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'id_complete', 'payment_complete', 'fully_verified', 'failed')),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_sessions_self"
  ON verification_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_verification_sessions_updated
  BEFORE UPDATE ON verification_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_id
  ON verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_didit
  ON verification_sessions(didit_session_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_stripe
  ON verification_sessions(stripe_payment_intent_id);

-- ── 3. event_chats table ─────────────────────────────────────────
-- Real-time messages per event (purged 72h after date_end)
CREATE TABLE IF NOT EXISTS event_chats (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL DEFAULT 'guest'
                    CHECK (role IN ('organizer', 'guest', 'staff')),
  message         TEXT        NOT NULL CHECK (char_length(message) <= 2000),
  screenshot_url  TEXT,       -- P2P payment screenshot URL (storage, pre-purge)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_chats ENABLE ROW LEVEL SECURITY;

-- Organizer can read/delete all messages for their events
CREATE POLICY "event_chats_organizer"
  ON event_chats FOR ALL
  USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Authenticated users can insert their own messages
CREATE POLICY "event_chats_user_insert"
  ON event_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read messages for events they registered for
CREATE POLICY "event_chats_user_read"
  ON event_chats FOR SELECT
  USING (
    auth.uid() = user_id
    OR event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_event_chats_event_id   ON event_chats(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chats_created_at ON event_chats(created_at DESC);

-- ── 4. event_ledger table ─────────────────────────────────────────
-- Immutable audit skeleton — persists forever after purge
CREATE TABLE IF NOT EXISTS event_ledger (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  ref_id        TEXT        NOT NULL,
  ledger_type   TEXT        NOT NULL
                  CHECK (ledger_type IN (
                    'stripe_charge', 'didit_verification',
                    'chat_purge_record', 'media_purge_record'
                  )),
  amount        NUMERIC(10,2),   -- NULL for non-financial records
  currency      TEXT        DEFAULT 'PKR',
  metadata      JSONB       NOT NULL DEFAULT '{}',
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_ledger ENABLE ROW LEVEL SECURITY;

-- Only organizers can read their own event ledger (write is service-role only)
CREATE POLICY "event_ledger_organizer_read"
  ON event_ledger FOR SELECT
  USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_event_ledger_event_id ON event_ledger(event_id);
CREATE INDEX IF NOT EXISTS idx_event_ledger_user_id  ON event_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_event_ledger_type     ON event_ledger(ledger_type);
CREATE INDEX IF NOT EXISTS idx_event_ledger_recorded ON event_ledger(recorded_at DESC);

-- ── 5. Realtime publication ───────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE event_chats;
