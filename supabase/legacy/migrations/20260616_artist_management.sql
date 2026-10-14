-- ============================================================
-- TIKKIT X — Artist Management Module (safe / idempotent)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 0. set_updated_at helper ─────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── 1. verifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verifications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     uuid        NOT NULL,
  entity_type   text        NOT NULL CHECK (entity_type IN ('organizer','management','artist')),
  tier          int         NOT NULL DEFAULT 1 CHECK (tier IN (1,2,3)),
  status        text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','verified','suspended')),
  verified_at   timestamptz,
  verified_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, entity_type)
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verifications_admin_all"          ON verifications;
DROP POLICY IF EXISTS "verifications_self_read"          ON verifications;
DROP POLICY IF EXISTS "verifications_artist_public_read" ON verifications;

CREATE POLICY "verifications_admin_all" ON verifications
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "verifications_self_read" ON verifications
  FOR SELECT USING (entity_id = auth.uid());

CREATE POLICY "verifications_artist_public_read" ON verifications
  FOR SELECT USING (entity_type = 'artist');

CREATE INDEX IF NOT EXISTS idx_verifications_entity ON verifications(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_verifications_status  ON verifications(status);

DROP TRIGGER IF EXISTS trg_verifications_updated ON verifications;
CREATE TRIGGER trg_verifications_updated
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backfill existing verified organizers (safe — ignores missing columns)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cnic_status'
  ) THEN
    INSERT INTO verifications (entity_id, entity_type, tier, status, verified_at)
    SELECT id, 'organizer', 2, 'verified', now()
    FROM profiles
    WHERE role IN ('organizer','staff','admin')
      AND (
        (cnic_status IS NOT NULL AND cnic_status = 'verified')
        OR (is_id_verified IS NOT NULL AND is_id_verified = TRUE)
      )
    ON CONFLICT (entity_id, entity_type) DO NOTHING;
  END IF;
END $$;

-- ── 2. management_accounts ───────────────────────────────────
CREATE TABLE IF NOT EXISTS management_accounts (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name         text        NOT NULL,
  primary_contact_name text        NOT NULL DEFAULT '',
  contact_email        text        NOT NULL DEFAULT '',
  contact_phone        text,
  website              text,
  account_status       text        NOT NULL DEFAULT 'active'
                         CHECK (account_status IN ('active','suspended','inactive')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE management_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mgmt_accounts_owner_all" ON management_accounts;
DROP POLICY IF EXISTS "mgmt_accounts_admin_all" ON management_accounts;

CREATE POLICY "mgmt_accounts_owner_all" ON management_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "mgmt_accounts_admin_all" ON management_accounts
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP TRIGGER IF EXISTS trg_mgmt_accounts_updated ON management_accounts;
CREATE TRIGGER trg_mgmt_accounts_updated
  BEFORE UPDATE ON management_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 3. artists ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artists (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  management_id        uuid        NOT NULL REFERENCES management_accounts(id) ON DELETE CASCADE,
  name                 text        NOT NULL,
  slug                 text        NOT NULL UNIQUE,
  category             text        NOT NULL CHECK (category IN ('dj','musician','comedian')),
  sub_tags             text[]      NOT NULL DEFAULT '{}',
  based_in_city        text,
  bio                  text,
  profile_photo_url    text,
  gallery_urls         text[]      NOT NULL DEFAULT '{}',
  press_kit_url        text,
  media_links          jsonb       NOT NULL DEFAULT '{}',
  social_links         jsonb       NOT NULL DEFAULT '{}',
  event_types_accepted text[]      NOT NULL DEFAULT '{}',
  availability_status  text        NOT NULL DEFAULT 'accepting'
                         CHECK (availability_status IN ('accepting','limited','not_accepting')),
  profile_status       text        NOT NULL DEFAULT 'draft'
                         CHECK (profile_status IN ('draft','published','paused')),
  verified             boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artists_public_read"        ON artists;
DROP POLICY IF EXISTS "artists_mgmt_read"          ON artists;
DROP POLICY IF EXISTS "artists_admin_insert"       ON artists;
DROP POLICY IF EXISTS "artists_mgmt_insert_draft"  ON artists;
DROP POLICY IF EXISTS "artists_admin_delete"       ON artists;
DROP POLICY IF EXISTS "artists_admin_update"       ON artists;
DROP POLICY IF EXISTS "artists_mgmt_update"        ON artists;

CREATE POLICY "artists_public_read" ON artists
  FOR SELECT USING (profile_status = 'published');

CREATE POLICY "artists_mgmt_read" ON artists
  FOR SELECT USING (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "artists_admin_insert" ON artists
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Management can insert draft artists
CREATE POLICY "artists_mgmt_insert_draft" ON artists
  FOR INSERT WITH CHECK (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
    AND profile_status = 'draft'
    AND verified = FALSE
  );

CREATE POLICY "artists_admin_delete" ON artists
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "artists_admin_update" ON artists
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "artists_mgmt_update" ON artists
  FOR UPDATE USING (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_artists_slug     ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_artists_category ON artists(category);
CREATE INDEX IF NOT EXISTS idx_artists_mgmt     ON artists(management_id);
CREATE INDEX IF NOT EXISTS idx_artists_status   ON artists(profile_status);
CREATE INDEX IF NOT EXISTS idx_artists_city     ON artists(based_in_city);

DROP TRIGGER IF EXISTS trg_artists_updated ON artists;
CREATE TRIGGER trg_artists_updated
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION auto_verify_artist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO verifications (entity_id, entity_type, tier, status, verified_at)
  VALUES (NEW.id, 'artist', 2, 'verified', now())
  ON CONFLICT (entity_id, entity_type) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_verify_artist ON artists;
CREATE TRIGGER trg_auto_verify_artist
  AFTER INSERT ON artists
  FOR EACH ROW EXECUTE FUNCTION auto_verify_artist();

-- ── 4. artist_enquiries ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_enquiries (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id            uuid        NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  management_id        uuid        NOT NULL REFERENCES management_accounts(id) ON DELETE CASCADE,
  organiser_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name           text        NOT NULL,
  event_type           text        NOT NULL,
  event_date           date        NOT NULL,
  event_city           text        NOT NULL,
  event_venue          text,
  estimated_attendance text        NOT NULL,
  performance_duration text        NOT NULL,
  set_type             text,
  additional_notes     text,
  status               text        NOT NULL DEFAULT 'submitted'
                         CHECK (status IN ('submitted','viewed','responded','negotiating','booked','declined','expired')),
  viewed_at            timestamptz,
  responded_at         timestamptz,
  booked_at            timestamptz,
  declined_at          timestamptz,
  decline_reason       text,
  expires_at           timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE artist_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enquiries_organiser_insert" ON artist_enquiries;
DROP POLICY IF EXISTS "enquiries_organiser_read"   ON artist_enquiries;
DROP POLICY IF EXISTS "enquiries_mgmt_read"        ON artist_enquiries;
DROP POLICY IF EXISTS "enquiries_mgmt_update"      ON artist_enquiries;
DROP POLICY IF EXISTS "enquiries_admin_all"        ON artist_enquiries;

CREATE POLICY "enquiries_organiser_insert" ON artist_enquiries
  FOR INSERT WITH CHECK (
    auth.uid() = organiser_id
    AND EXISTS (
      SELECT 1 FROM verifications
      WHERE entity_id = auth.uid() AND entity_type = 'organizer' AND status = 'verified'
    )
  );

CREATE POLICY "enquiries_organiser_read" ON artist_enquiries
  FOR SELECT USING (auth.uid() = organiser_id);

CREATE POLICY "enquiries_mgmt_read" ON artist_enquiries
  FOR SELECT USING (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "enquiries_mgmt_update" ON artist_enquiries
  FOR UPDATE USING (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "enquiries_admin_all" ON artist_enquiries
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_enquiries_artist    ON artist_enquiries(artist_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_mgmt      ON artist_enquiries(management_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_organiser ON artist_enquiries(organiser_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status    ON artist_enquiries(status);

DROP TRIGGER IF EXISTS trg_enquiries_updated ON artist_enquiries;
CREATE TRIGGER trg_enquiries_updated
  BEFORE UPDATE ON artist_enquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION sync_enquiry_viewed_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.viewed_at IS NOT NULL AND OLD.viewed_at IS NULL AND NEW.status = 'submitted' THEN
    NEW.status = 'viewed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enquiry_viewed_sync ON artist_enquiries;
CREATE TRIGGER trg_enquiry_viewed_sync
  BEFORE UPDATE ON artist_enquiries
  FOR EACH ROW EXECUTE FUNCTION sync_enquiry_viewed_status();

-- ── 5. artist_past_events ────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_past_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id         uuid        NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  event_name        text        NOT NULL,
  event_date        date        NOT NULL,
  venue_name        text,
  city              text        NOT NULL,
  is_platform_event boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE artist_past_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "past_events_public_read"  ON artist_past_events;
DROP POLICY IF EXISTS "past_events_mgmt_write"   ON artist_past_events;
DROP POLICY IF EXISTS "past_events_admin_all"    ON artist_past_events;

CREATE POLICY "past_events_public_read" ON artist_past_events FOR SELECT USING (true);

CREATE POLICY "past_events_mgmt_write" ON artist_past_events
  FOR ALL USING (
    artist_id IN (
      SELECT id FROM artists WHERE management_id IN (
        SELECT id FROM management_accounts WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "past_events_admin_all" ON artist_past_events
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_past_events_artist ON artist_past_events(artist_id);
CREATE INDEX IF NOT EXISTS idx_past_events_date   ON artist_past_events(event_date DESC);

-- ── 6. management_notifications ──────────────────────────────
CREATE TABLE IF NOT EXISTS management_notifications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  management_id uuid        NOT NULL REFERENCES management_accounts(id) ON DELETE CASCADE,
  artist_id     uuid        REFERENCES artists(id) ON DELETE CASCADE,
  enquiry_id    uuid        REFERENCES artist_enquiries(id) ON DELETE CASCADE,
  type          text        NOT NULL
                  CHECK (type IN ('new_enquiry','enquiry_expiring','enquiry_expired','profile_published','event_linked')),
  read          boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE management_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_mgmt_read"  ON management_notifications;
DROP POLICY IF EXISTS "notifications_admin_all"  ON management_notifications;

CREATE POLICY "notifications_mgmt_read" ON management_notifications
  FOR ALL USING (
    management_id IN (SELECT id FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_admin_all" ON management_notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_mgmt_notifs_mgmt   ON management_notifications(management_id);
CREATE INDEX IF NOT EXISTS idx_mgmt_notifs_unread ON management_notifications(management_id) WHERE read = false;

CREATE OR REPLACE FUNCTION notify_management_on_enquiry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO management_notifications (management_id, artist_id, enquiry_id, type)
  VALUES (NEW.management_id, NEW.artist_id, NEW.id, 'new_enquiry');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_enquiry ON artist_enquiries;
CREATE TRIGGER trg_notify_on_enquiry
  AFTER INSERT ON artist_enquiries
  FOR EACH ROW EXECUTE FUNCTION notify_management_on_enquiry();

-- ── 7. Storage buckets ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('artist-photos',    'artist-photos',    true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('artist-gallery',   'artist-gallery',   true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('artist-press-kit', 'artist-press-kit', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "artist_photos_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "artist_photos_mgmt_upload"  ON storage.objects;
DROP POLICY IF EXISTS "artist_photos_mgmt_delete"  ON storage.objects;
DROP POLICY IF EXISTS "press_kit_mgmt_rw"          ON storage.objects;

CREATE POLICY "artist_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('artist-photos','artist-gallery'));

CREATE POLICY "artist_photos_mgmt_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id IN ('artist-photos','artist-gallery')
    AND EXISTS (SELECT 1 FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "artist_photos_mgmt_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id IN ('artist-photos','artist-gallery')
    AND EXISTS (SELECT 1 FROM management_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "press_kit_mgmt_rw" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'artist-press-kit'
    AND EXISTS (SELECT 1 FROM management_accounts WHERE user_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
