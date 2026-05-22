-- Add admin_status to events for master admin management
-- Allows admins to flag or suspend events independently of the organizer's own status field.
-- 'flagged'   → under review (event stays visible/live but marked for attention)
-- 'suspended' → event hidden/cancelled by admin action
-- NULL (default) → no admin action taken

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS admin_status TEXT
    CHECK (admin_status IS NULL OR admin_status IN ('flagged', 'suspended'));

CREATE INDEX IF NOT EXISTS idx_events_admin_status ON events(admin_status) WHERE admin_status IS NOT NULL;
