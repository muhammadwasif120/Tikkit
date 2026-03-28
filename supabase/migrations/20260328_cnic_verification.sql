-- CNIC Verification columns for Pakistani market
-- Didit + PayPro retained in codebase for future international market rollout

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cnic_number       TEXT,
  ADD COLUMN IF NOT EXISTS cnic_expiry       TEXT,
  ADD COLUMN IF NOT EXISTS cnic_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS cnic_status       TEXT DEFAULT 'none',  -- none | pending | verified | rejected
  ADD COLUMN IF NOT EXISTS cnic_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cnic_reject_reason TEXT;

-- Index for admin queries filtering by status
CREATE INDEX IF NOT EXISTS idx_profiles_cnic_status ON profiles(cnic_status);

-- Storage bucket for CNIC images (private, watermarked)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cnic-documents',
  'cnic-documents',
  false,
  10485760,  -- 10 MB max
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can only upload/read their own CNIC
CREATE POLICY "Users can upload their own CNIC"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cnic-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own CNIC"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cnic-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin can read all CNICs for review
CREATE POLICY "Admins can read all CNIC documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cnic-documents'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
