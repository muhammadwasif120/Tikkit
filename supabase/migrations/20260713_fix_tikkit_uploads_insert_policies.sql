-- ════════════════════════════════════════════════════════════════
-- Fix: restore missing INSERT/UPDATE policies on tikkit-uploads
-- ════════════════════════════════════════════════════════════════
-- 20260518_db_security_fixes.sql dropped the broad "Auth upload
-- tikkit-uploads" policy and replaced it with a single narrow INSERT
-- policy scoped to bucket_id = 'tikkit-uploads', folder
-- 'payment-screenshots' — a path that isn't actually used (guest
-- payment screenshots upload to the separate 'payment-screenshots'
-- bucket, not a folder inside tikkit-uploads).
--
-- That left no INSERT policy at all for the folders the app actually
-- writes to: avatars/{uid}.ext, profile-covers/{profileId}/..,
-- profile-logos/{profileId}/.., event-covers/{eventId}/.. — every
-- upload to these paths now fails with "new row violates row-level
-- security policy". The generic "own folder update/delete" policies
-- added in the same migration also never match avatars/ (no second
-- path segment) or event-covers/ (segment 2 is the event id, not the
-- uploader's uid), so upsert (update-if-exists) fails too.

-- Avatars: own file only (path has no per-user folder, just
-- avatars/{uid}.ext, so match on filename prefix instead of foldername[2])
CREATE POLICY "tikkit-uploads: own avatar insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'avatars'
    AND name = 'avatars/' || auth.uid()::text || '.' || (regexp_match(name, '\.([^.]+)$'))[1]
  );

CREATE POLICY "tikkit-uploads: own avatar update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'avatars'
    AND name = 'avatars/' || auth.uid()::text || '.' || (regexp_match(name, '\.([^.]+)$'))[1]
  );

-- Profile covers / logos: own profile folder (foldername[2] = auth.uid())
-- UPDATE/DELETE already covered by "tikkit-uploads: own folder update/delete"
CREATE POLICY "tikkit-uploads: own profile cover insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'profile-covers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "tikkit-uploads: own profile logo insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'profile-logos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Event covers: organiser must own the event (foldername[2] = event id)
CREATE POLICY "tikkit-uploads: organizer event cover insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'event-covers'
    AND EXISTS (
      SELECT 1 FROM events
      WHERE id = (storage.foldername(name))[2]::uuid
        AND organizer_id = auth.uid()
    )
  );

CREATE POLICY "tikkit-uploads: organizer event cover update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'event-covers'
    AND EXISTS (
      SELECT 1 FROM events
      WHERE id = (storage.foldername(name))[2]::uuid
        AND organizer_id = auth.uid()
    )
  );

CREATE POLICY "tikkit-uploads: organizer event cover delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tikkit-uploads'
    AND (storage.foldername(name))[1] = 'event-covers'
    AND EXISTS (
      SELECT 1 FROM events
      WHERE id = (storage.foldername(name))[2]::uuid
        AND organizer_id = auth.uid()
    )
  );
