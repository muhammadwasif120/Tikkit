-- ============================================================
-- Replace stripe_payment_intent_id with paypro_order_id
-- on verification_sessions table
-- ============================================================

ALTER TABLE verification_sessions
  RENAME COLUMN stripe_payment_intent_id TO paypro_order_id;

-- Update the unique index to match new column name
DROP INDEX IF EXISTS idx_verification_sessions_stripe;

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_sessions_paypro
  ON verification_sessions(paypro_order_id)
  WHERE paypro_order_id IS NOT NULL;

-- Also update the event_ledger CHECK to use paypro_charge instead of stripe_charge
ALTER TABLE event_ledger
  DROP CONSTRAINT IF EXISTS event_ledger_ledger_type_check;

ALTER TABLE event_ledger
  ADD CONSTRAINT event_ledger_ledger_type_check
  CHECK (ledger_type IN (
    'paypro_charge', 'didit_verification',
    'chat_purge_record', 'media_purge_record'
  ));
