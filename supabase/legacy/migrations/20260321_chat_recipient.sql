-- ============================================================
-- TIKKIT — Private organizer replies in event_chats
-- Migration: 20260321_chat_recipient
-- NULL recipient_user_id = broadcast to all registered guests
-- non-NULL = private reply visible only to that guest
-- ============================================================

ALTER TABLE event_chats
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_chats_recipient
  ON event_chats(recipient_user_id)
  WHERE recipient_user_id IS NOT NULL;

-- Update read policy so guests can see:
--   1. Their own messages
--   2. Organizer broadcasts (recipient_user_id IS NULL)
--   3. Organizer private replies addressed to them
DROP POLICY IF EXISTS "event_chats_user_read" ON event_chats;
CREATE POLICY "event_chats_user_read"
  ON event_chats FOR SELECT
  USING (
    -- Own messages
    auth.uid() = user_id
    -- Organizer of this event can read everything
    OR event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
    -- Registered guests: broadcasts + private replies to them
    OR (
      role = 'organizer'
      AND (recipient_user_id IS NULL OR recipient_user_id = auth.uid())
      AND event_id IN (
        SELECT pr.event_id
        FROM public_registrations pr
        INNER JOIN auth.users u ON u.email = pr.email
        WHERE u.id = auth.uid()
          AND pr.status != 'rejected'
      )
    )
  );
