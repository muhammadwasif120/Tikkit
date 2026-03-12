-- ============================================================
-- TIKKIT — Supabase Schema
-- Phase 1 + Phase 2
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'organizer' CHECK (role IN ('organizer', 'staff', 'admin', 'guest')),
  phone_number TEXT,
  company_name TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  username TEXT UNIQUE,
  notification_preferences JSONB NOT NULL DEFAULT '{"guest_signup":true,"guest_cancellation":true,"entry_scan":true,"exit_scan":false,"vendor_payment_due":true,"event_going_live":true,"event_ended":true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  venue_name TEXT,
  venue_address TEXT,
  -- Secret venue: address hidden until confirmed
  secret_venue BOOLEAN DEFAULT FALSE,
  venue_reveal_at TIMESTAMPTZ,
  date_start TIMESTAMPTZ NOT NULL,
  date_end TIMESTAMPTZ,
  capacity INTEGER NOT NULL DEFAULT 100,
  is_private BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  cover_image_url TEXT,
  tags TEXT[],
  -- Demographic ratio controls
  male_ratio INTEGER DEFAULT 50 CHECK (male_ratio BETWEEN 0 AND 100),
  female_ratio INTEGER DEFAULT 50 CHECK (female_ratio BETWEEN 0 AND 100),
  -- Finance (legacy single-price; prefer ticket_types for multi-tier)
  ticket_price NUMERIC(10,2) DEFAULT 0,
  budget NUMERIC(10,2) DEFAULT 0,
  -- Registration settings
  registration_mode TEXT NOT NULL DEFAULT 'invite_only'
    CHECK (registration_mode IN ('invite_only', 'open', 'expression_of_interest')),
  require_id_verification BOOLEAN DEFAULT FALSE,
  require_reference_code BOOLEAN DEFAULT FALSE,
  reference_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TICKET TYPES
-- ============================================================
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g. "Standard", "VIP", "Discounted"
  price NUMERIC(10,2) DEFAULT 0,         -- Final charged price
  original_price NUMERIC(10,2),          -- Pre-discount price (Discounted tier)
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2),          -- e.g. 20 (percent) or 500 (fixed PKR)
  quantity INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GUESTS / ATTENDEES
-- ============================================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  qr_code TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4()::TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  is_vip BOOLEAN DEFAULT FALSE,
  plus_one BOOLEAN DEFAULT FALSE,
  plus_one_name TEXT,
  -- Waitlist
  waitlist BOOLEAN DEFAULT FALSE,
  waitlist_position INTEGER,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GUEST PROFILES (for authenticated guest users)
-- ============================================================
CREATE TABLE guest_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  phone TEXT,
  bio TEXT,
  ratings_given INTEGER DEFAULT 0,
  social_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUBLIC REGISTRATIONS (guest self-registrations for events)
-- ============================================================
CREATE TABLE public_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_in')),
  payment_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required', 'pending', 'submitted', 'confirmed')),
  registration_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- ============================================================
-- CHECK-IN SCANS (Phase 2 — entry/exit log)
-- ============================================================
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES profiles(id),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('entry', 'exit')),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  device_info TEXT,
  is_offline_sync BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- VENDORS
-- ============================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,               -- e.g. "Catering", "AV", "Security"
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VENDOR INVOICES
-- ============================================================
CREATE TABLE vendor_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  invoice_number TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'disputed')),
  description TEXT,
  document_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISCOUNT CODES
-- ============================================================
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, code)
);

-- ============================================================
-- WAITLIST (Phase 2)
-- ============================================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  position INTEGER NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  converted_to_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_qr ON guests(qr_code);
CREATE INDEX idx_guests_status ON guests(status);
CREATE INDEX idx_scan_logs_event ON scan_logs(event_id);
CREATE INDEX idx_scan_logs_guest ON scan_logs(guest_id);
CREATE INDEX idx_vendor_invoices_vendor ON vendor_invoices(vendor_id);
CREATE INDEX idx_vendor_invoices_event ON vendor_invoices(event_id);
CREATE INDEX idx_guest_profiles_id ON guest_profiles(id);
CREATE INDEX idx_public_registrations_event ON public_registrations(event_id);
CREATE INDEX idx_public_registrations_email ON public_registrations(email);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_registrations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Events: organizer owns their events
CREATE POLICY "events_organizer_all" ON events
  FOR ALL USING (auth.uid() = organizer_id);

-- Public events are readable by anyone authenticated
CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (is_public = TRUE AND status = 'published');

-- Ticket types: organizer of the event
CREATE POLICY "ticket_types_organizer" ON ticket_types
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Guests: organizer of the event + staff can scan
CREATE POLICY "guests_organizer" ON guests
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Scan logs: organizer
CREATE POLICY "scan_logs_organizer" ON scan_logs
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Vendors: organizer owns
CREATE POLICY "vendors_organizer" ON vendors
  FOR ALL USING (auth.uid() = organizer_id);

-- Vendor invoices: via vendor ownership
CREATE POLICY "vendor_invoices_organizer" ON vendor_invoices
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE organizer_id = auth.uid())
  );

-- Discount codes: organizer
CREATE POLICY "discount_codes_organizer" ON discount_codes
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Waitlist: organizer
CREATE POLICY "waitlist_organizer" ON waitlist
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Guest profiles: users can read/update their own
CREATE POLICY "guest_profiles_self" ON guest_profiles
  FOR ALL USING (auth.uid() = id);

-- Public registrations: guests can read/create/update their own, organizer can see all for their events
CREATE POLICY "public_registrations_guest_self" ON public_registrations
  FOR SELECT USING (email = current_user_email() OR auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id));

CREATE POLICY "public_registrations_organizer" ON public_registrations
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

CREATE POLICY "public_registrations_insert" ON public_registrations
  FOR INSERT WITH CHECK (true);