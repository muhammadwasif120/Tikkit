-- Add QR token storage to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_token_generated_at TIMESTAMPTZ;

-- Add offline check-in sync tracking
CREATE TABLE IF NOT EXISTS offline_checkin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id),
  event_id UUID REFERENCES events(id),
  scanned_at TIMESTAMPTZ NOT NULL,
  scanner_device TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
