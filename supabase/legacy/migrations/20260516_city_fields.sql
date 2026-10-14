-- Add city to profiles (signup geo-tracking) and events (event location)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.events   ADD COLUMN IF NOT EXISTS city TEXT;
