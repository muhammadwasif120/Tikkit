-- ─────────────────────────────────────────────────────────────────────────────
-- Vendor X Phase 1 — Vendor OS
-- Renames existing organiser-side vendor tables to avoid collision,
-- then creates the Vendor X data model with full RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename existing organiser-side tables
ALTER TABLE IF EXISTS vendors RENAME TO organiser_vendor_contacts;
ALTER TABLE IF EXISTS vendor_invoices RENAME TO organiser_vendor_invoices;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. VENDORS — Vendor X accounts (the vendor entity, not an organiser contact)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE vendors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_name    text NOT NULL,
  company_name    text,
  logo_url        text,
  category        text NOT NULL,  -- 'av_production' | 'fnb' | 'human_capital' | 'infrastructure'
  sub_types       text[] DEFAULT '{}',
  cities_covered  text[] DEFAULT '{}',
  bio             text CHECK (char_length(bio) <= 280),
  portfolio_urls  text[] DEFAULT '{}',
  verification_tier integer NOT NULL DEFAULT 1 CHECK (verification_tier IN (1, 2, 3)),
  verified_at     timestamptz,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)  -- one vendor account per user
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
-- Vendor sees only their own row
CREATE POLICY "vendors_owner" ON vendors
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DEALS — CRM pipeline
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE deal_stage AS ENUM (
  'new_inquiry',
  'quote_sent',
  'negotiating',
  'deposit_confirmed',
  'confirmed',
  'event_day',
  'fulfilled',
  'lost'
);

CREATE TYPE event_type_tag AS ENUM (
  'wedding', 'corporate', 'concert', 'festival', 'private', 'other'
);

CREATE TABLE deals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  client_name      text NOT NULL,
  client_contact   text,  -- phone or email — stored privately
  event_name       text NOT NULL,
  event_date       date,
  event_type       event_type_tag NOT NULL DEFAULT 'other',
  event_location   text,
  quote_value      numeric(12, 2) NOT NULL DEFAULT 0,
  stage            deal_stage NOT NULL DEFAULT 'new_inquiry',
  notes            text,
  linked_event_id  uuid REFERENCES events(id) ON DELETE SET NULL,
  won_lost_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- Vendor sees only their own deals
CREATE POLICY "deals_owner" ON deals
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_deals_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INVOICES — Vendor's invoices to clients
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'
);

CREATE TABLE invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  deal_id               uuid REFERENCES deals(id) ON DELETE SET NULL,
  client_name           text NOT NULL,
  client_email          text,
  client_phone          text,
  invoice_number        text NOT NULL,  -- e.g. TKX-V001 — set by app
  issue_date            date NOT NULL DEFAULT current_date,
  due_date              date,
  line_items            jsonb NOT NULL DEFAULT '[]',
  -- line_items shape: [{ description, quantity, unit_price, line_total }]
  subtotal              numeric(12, 2) NOT NULL DEFAULT 0,
  tax                   numeric(12, 2) DEFAULT 0,
  total                 numeric(12, 2) NOT NULL DEFAULT 0,
  payment_instructions  text,
  notes                 text,
  status                invoice_status NOT NULL DEFAULT 'draft',
  advance_amount        numeric(12, 2) DEFAULT 0,
  advance_confirmed_at  timestamptz,
  paid_in_full_at       timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- Vendor sees only their own invoices
CREATE POLICY "invoices_owner" ON invoices
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CROSS-HIRES — Sub-contractors and equipment rentals per deal
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE cross_hire_type AS ENUM (
  'sub_contractor', 'equipment_rental', 'transport', 'other'
);

CREATE TYPE cross_hire_payment_status AS ENUM (
  'pending', 'partially_paid', 'paid'
);

CREATE TABLE cross_hires (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id               uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  vendor_id             uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  type                  cross_hire_type NOT NULL DEFAULT 'sub_contractor',
  supplier_name         text NOT NULL,
  supplier_contact      text,  -- phone or email — stored privately
  supplier_user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description           text,
  cost                  numeric(12, 2) NOT NULL DEFAULT 0,
  payment_status        cross_hire_payment_status NOT NULL DEFAULT 'pending',
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cross_hires ENABLE ROW LEVEL SECURITY;
-- Vendor sees only their own cross-hires (absolute privacy)
CREATE POLICY "cross_hires_owner" ON cross_hires
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX deals_vendor_id_idx ON deals(vendor_id);
CREATE INDEX deals_stage_idx ON deals(stage);
CREATE INDEX deals_event_date_idx ON deals(event_date);
CREATE INDEX invoices_vendor_id_idx ON invoices(vendor_id);
CREATE INDEX invoices_deal_id_idx ON invoices(deal_id);
CREATE INDEX invoices_status_idx ON invoices(status);
CREATE INDEX invoices_due_date_idx ON invoices(due_date);
CREATE INDEX cross_hires_deal_id_idx ON cross_hires(deal_id);
CREATE INDEX cross_hires_vendor_id_idx ON cross_hires(vendor_id);
