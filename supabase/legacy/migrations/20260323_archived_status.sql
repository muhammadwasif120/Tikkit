-- Migration: add 'archived' as a valid event status
-- Run this in Supabase SQL Editor before deploying the auto-archive feature.

-- 1. Drop existing status check constraint (if any) and re-add with 'archived'
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft', 'published', 'completed', 'archived', 'cancelled'));

-- 2. (Optional) Enable pg_cron extension if not already enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. (Optional) Schedule auto-status sync every 30 minutes via pg_cron
-- SELECT cron.schedule(
--   'auto-archive-events',
--   '*/30 * * * *',
--   $$
--     -- published → completed (12h after date_end)
--     UPDATE events
--     SET status = 'completed'
--     WHERE status = 'published'
--       AND date_end < NOW() - INTERVAL '12 hours';

--     -- completed → archived (72h after date_end)
--     UPDATE events
--     SET status = 'archived'
--     WHERE status = 'completed'
--       AND date_end < NOW() - INTERVAL '72 hours';
--   $$
-- );
