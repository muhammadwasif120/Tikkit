-- 20260326_add_reference_code_entered.sql
-- Adds the missing reference_code_entered column to the public_registrations table.

ALTER TABLE public_registrations 
ADD COLUMN IF NOT EXISTS reference_code_entered TEXT;
