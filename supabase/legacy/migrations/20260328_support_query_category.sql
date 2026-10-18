-- Add category column to support_queries for structured dispute routing
ALTER TABLE support_queries
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Valid categories
-- ticket_registration | event_cancellation | organizer_dispute | attendee_dispute
-- account_access | payment_billing | technical_bug | feature_request | other

CREATE INDEX IF NOT EXISTS idx_support_queries_category ON support_queries(category);
