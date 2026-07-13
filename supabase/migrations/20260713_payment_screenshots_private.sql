-- ════════════════════════════════════════════════════════════════
-- SEC-02: Make the payment-screenshots bucket private
-- ════════════════════════════════════════════════════════════════
-- Payment screenshots hold bank/wallet transaction details and personal
-- names. The bucket was public, so any stored getPublicUrl() was permanently
-- reachable by anyone who obtained the link — no auth, no expiry.
--
-- The application no longer reads these objects directly. All display paths go
-- through signPaymentScreenshot() (src/lib/paymentScreenshot.ts), which mints a
-- short-lived signed URL using the service role, only after the calling server
-- code has authorized the viewer (event organizer, admin, or the owning guest).
--
-- This migration flips the bucket to private. With no public flag and no anon/
-- authenticated SELECT policy on storage.objects for this bucket, the only way
-- to read an object is a service-role signed URL — exactly what the app now does.

UPDATE storage.buckets
  SET public = false
  WHERE id = 'payment-screenshots';

-- Defensive: remove any SELECT-only read policies for this bucket. Signed URLs
-- do not depend on a SELECT policy, and uploads use INSERT policies (or the
-- service role), so dropping SELECT-only policies cannot break reads or writes.
-- We deliberately do NOT auto-drop FOR ALL policies here — those may also grant
-- the INSERT that guest uploads rely on. Any ALL policy is reported below for
-- manual review instead.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND qual ILIKE '%payment-screenshots%'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND qual ILIKE '%payment-screenshots%'
      AND cmd = 'ALL'
  LOOP
    RAISE NOTICE 'Review manually: FOR ALL policy "%" references payment-screenshots and may grant authenticated read. Consider splitting into INSERT/UPDATE-only.', pol.policyname;
  END LOOP;
END $$;

-- Verify after applying:
--   SELECT id, public FROM storage.buckets WHERE id = 'payment-screenshots';
--   -- public should be false
--   SELECT policyname, cmd FROM pg_policies
--     WHERE schemaname='storage' AND tablename='objects'
--       AND qual ILIKE '%payment-screenshots%';
--   -- confirm no SELECT policy remains; review any FOR ALL policy
