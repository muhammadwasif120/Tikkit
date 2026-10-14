-- Venue Enquiries & Programme Registrations
-- Enables in-app contact and booking flows for the guest-facing venue experience

-- ── Enquiries ────────────────────────────────────────────────────────────────
CREATE TYPE enquiry_status AS ENUM ('new', 'read', 'replied', 'archived');

CREATE TABLE venue_enquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  programme_id  uuid REFERENCES programmes(id) ON DELETE SET NULL,
  resource_id   uuid REFERENCES resources(id) ON DELETE SET NULL,
  guest_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name    text NOT NULL,
  guest_phone   text,
  message       text NOT NULL,
  status        enquiry_status NOT NULL DEFAULT 'new',
  reply         text,
  replied_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX venue_enquiries_venue_idx  ON venue_enquiries(venue_id, created_at DESC);
CREATE INDEX venue_enquiries_guest_idx  ON venue_enquiries(guest_id);

ALTER TABLE venue_enquiries ENABLE ROW LEVEL SECURITY;

-- Guest sees their own enquiries
CREATE POLICY venue_enquiries_guest_read ON venue_enquiries
  FOR SELECT USING (guest_id = auth.uid());

-- Guest inserts their own
CREATE POLICY venue_enquiries_guest_insert ON venue_enquiries
  FOR INSERT WITH CHECK (guest_id = auth.uid() OR guest_id IS NULL);

-- Venue owner sees + manages all enquiries for their venue
CREATE POLICY venue_enquiries_owner_all ON venue_enquiries
  FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
  );

-- ── Programme Registrations ──────────────────────────────────────────────────
CREATE TYPE programme_reg_status AS ENUM ('pending', 'confirmed', 'cancelled', 'attended');

CREATE TABLE programme_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id  uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  instance_id   uuid REFERENCES programme_instances(id) ON DELETE SET NULL,
  venue_id      uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name    text NOT NULL,
  guest_phone   text,
  guest_count   integer NOT NULL DEFAULT 1,
  total_price   numeric(12,2) NOT NULL DEFAULT 0,
  currency      text NOT NULL DEFAULT 'PKR',
  status        programme_reg_status NOT NULL DEFAULT 'pending',
  notes         text,
  qr_token      text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prog_reg_user_idx     ON programme_registrations(user_id);
CREATE INDEX prog_reg_programme_idx ON programme_registrations(programme_id);
CREATE INDEX prog_reg_venue_idx    ON programme_registrations(venue_id, created_at DESC);

ALTER TABLE programme_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY prog_reg_user_own ON programme_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY prog_reg_user_insert ON programme_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY prog_reg_user_cancel ON programme_registrations
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY prog_reg_venue_owner ON programme_registrations
  FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
