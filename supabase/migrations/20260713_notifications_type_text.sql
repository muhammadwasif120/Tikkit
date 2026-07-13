-- ════════════════════════════════════════════════════════════════
-- Fix: notifications.type must be free-form TEXT, not a fixed enum
-- ════════════════════════════════════════════════════════════════
-- The application uses many `type` values as free-form strings
-- (payment_confirmed, registration_rejected, payment_submitted,
-- organizer_invite, new_registration, eoi_submitted, eoi_approved,
-- eoi_approved_payment_required, …). The original manually-created table left
-- some environments with `type` as a restrictive `notification_type` enum that
-- only allowed 7 values, which would silently reject every other insert.
--
-- The tracked migration (20260518_security_audit_fixes.sql) already declares
-- `type TEXT`. This migration makes that guaranteed: if `type` is still an enum
-- in this environment, convert it to text. Idempotent — it only rewrites the
-- column when it is not already text, so re-running is a no-op.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'notifications'
      AND column_name = 'type'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN type TYPE text USING type::text;
  END IF;
END $$;

-- Verify after applying:
--   SELECT data_type FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='notifications' AND column_name='type';
--   -- expected: text
