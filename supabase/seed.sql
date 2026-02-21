-- ============================================================
-- TIKKIT — Seed Data (Development Only)
-- Run after schema.sql
-- ============================================================

-- NOTE: In development, create a user via Supabase Auth UI first,
-- then update the UUID below to match that user's auth.uid()

-- Example seed profile (replace UUID with your auth user ID)
-- INSERT INTO profiles (id, full_name, email, role) VALUES
--   ('your-auth-uuid-here', 'Demo Organizer', 'demo@tikkit.io', 'organizer');

-- Example event
-- INSERT INTO events (organizer_id, title, description, venue_name, date_start, capacity, is_public, status) VALUES
--   ('your-auth-uuid-here', 'Art Basel Karachi', 'A curated evening of contemporary art and music.', 'Canvas Gallery, DHA Phase 6', NOW() + INTERVAL '14 days', 200, TRUE, 'published');