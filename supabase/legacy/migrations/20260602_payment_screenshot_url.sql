-- Add payment_screenshot_url to public_registrations (used by guest payment upload flow)
ALTER TABLE public_registrations
  ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
