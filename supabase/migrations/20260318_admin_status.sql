-- Add admin_status to profiles for master admin management
-- Allows Tikkit admins to mark organizers as under review or suspended
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_status TEXT NOT NULL DEFAULT 'active'
    CHECK (admin_status IN ('active', 'review', 'suspended'));
