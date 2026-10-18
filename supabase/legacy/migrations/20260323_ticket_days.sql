-- Add ticket_days to support multi-day event ticketing
-- Stores an array of YYYY-MM-DD date strings the ticket is valid for.
-- NULL means single-day or unrestricted (all days valid).

ALTER TABLE public_registrations
  ADD COLUMN IF NOT EXISTS ticket_days TEXT[];

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS ticket_days TEXT[];
