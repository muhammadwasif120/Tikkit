-- Performance indexes — added 2026-05-16
-- These cover the most frequent query patterns identified in the performance audit.

-- profiles: role filter used on every master admin page load
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

-- public_registrations: payment_status filter used in approval flows + command center
CREATE INDEX IF NOT EXISTS idx_public_registrations_payment_status
  ON public_registrations(payment_status);

-- public_registrations: composite index for the common (event_id, status) filter pattern
CREATE INDEX IF NOT EXISTS idx_public_registrations_event_status
  ON public_registrations(event_id, status);

-- public_registrations: created_at used for ordering on every listing query
CREATE INDEX IF NOT EXISTS idx_public_registrations_created_at
  ON public_registrations(created_at DESC);

-- scan_logs: scanned_by used for staff audit queries
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_by
  ON scan_logs(scanned_by);

-- scan_logs: event_id + scanned_at for analytics heatmap queries
CREATE INDEX IF NOT EXISTS idx_scan_logs_event_scanned_at
  ON scan_logs(event_id, scanned_at DESC);

-- guests: created_at ordering used on every guest list page
CREATE INDEX IF NOT EXISTS idx_guests_created_at
  ON guests(created_at DESC);

-- notifications: user_id used by NotificationBell on every dashboard load
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);
