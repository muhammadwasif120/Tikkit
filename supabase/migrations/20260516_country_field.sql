-- Add country field to profiles for global expansion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Pakistan';
