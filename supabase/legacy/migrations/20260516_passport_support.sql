-- Support passport numbers for foreign nationals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type TEXT DEFAULT 'cnic';  -- 'cnic' | 'passport'
