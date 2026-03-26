-- 20260326_fix_vendors_rls.sql
-- Fixes RLS policies to allow authenticated organizers to insert and modify vendors and vendor_invoices.

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "vendors_organizer" ON vendors;
DROP POLICY IF EXISTS "vendor_invoices_organizer" ON vendor_invoices;

-- Recreate vendors policy explicitly for ALL commands with both USING and WITH CHECK
CREATE POLICY "vendors_organizer" ON vendors
  FOR ALL USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Recreate vendor_invoices policy matching the linked vendor's organizer
CREATE POLICY "vendor_invoices_organizer" ON vendor_invoices
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE organizer_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE organizer_id = auth.uid())
  );
