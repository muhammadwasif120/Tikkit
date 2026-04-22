-- Support Chat Read Receipts
-- Add flags to track when a message has been read by the opposing party.

ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS read_by_user BOOLEAN DEFAULT false;
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS read_by_admin BOOLEAN DEFAULT false;

-- For existing messages:
-- Assume those before this migration are considered "read" to prevent a flood of notifications
UPDATE support_messages SET read_by_user = true WHERE sender = 'admin' AND read_by_user = false;
UPDATE support_messages SET read_by_admin = true WHERE sender = 'user' AND read_by_admin = false;
