-- Venues Phase 2 — Spot Maps & Spot Bookings

-- Spot map: a named layout template for a venue
-- layout_json: array of { id, label, type, x, y, w, h, capacity, surcharge }
CREATE TABLE spot_maps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT 'Default Layout',
  layout_json  jsonb NOT NULL DEFAULT '[]',
  canvas_width  integer NOT NULL DEFAULT 800,
  canvas_height integer NOT NULL DEFAULT 500,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spot_maps_venue_idx ON spot_maps(venue_id);

ALTER TABLE spot_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY spot_maps_public_read ON spot_maps
  FOR SELECT USING (active = true);

CREATE POLICY spot_maps_owner_all ON spot_maps
  USING (venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid()))
  WITH CHECK (venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid()));

-- Spot bookings: a guest reserves a specific spot on a map for a programme instance or slot
CREATE TABLE spot_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_map_id     uuid NOT NULL REFERENCES spot_maps(id) ON DELETE CASCADE,
  spot_id         text NOT NULL,              -- references layout_json[*].id
  instance_id     uuid REFERENCES programme_instances(id) ON DELETE CASCADE,
  slot_booking_id uuid REFERENCES slot_bookings(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_size      integer NOT NULL DEFAULT 1,
  surcharge       numeric(12,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'confirmed',
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- one spot per instance/slot booking event
  UNIQUE NULLS NOT DISTINCT (spot_map_id, spot_id, instance_id),
  UNIQUE NULLS NOT DISTINCT (spot_map_id, spot_id, slot_booking_id)
);

CREATE INDEX spot_bookings_map_instance_idx  ON spot_bookings(spot_map_id, instance_id);
CREATE INDEX spot_bookings_map_slot_idx      ON spot_bookings(spot_map_id, slot_booking_id);
CREATE INDEX spot_bookings_user_idx          ON spot_bookings(user_id);

ALTER TABLE spot_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can read spot bookings (needed for realtime occupancy display)
CREATE POLICY spot_bookings_public_read ON spot_bookings
  FOR SELECT USING (true);

CREATE POLICY spot_bookings_user_insert ON spot_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY spot_bookings_user_cancel ON spot_bookings
  FOR UPDATE USING (auth.uid() = user_id AND status = 'confirmed');

CREATE POLICY spot_bookings_venue_owner ON spot_bookings
  FOR ALL USING (
    spot_map_id IN (
      SELECT sm.id FROM spot_maps sm
      JOIN venues v ON v.id = sm.venue_id
      WHERE v.owner_id = auth.uid()
    )
  );

-- Enable realtime on spot_bookings so clients can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE spot_bookings;

NOTIFY pgrst, 'reload schema';
