# Tikkit — Event Management Platform

> Plan. Sell. Manage. All in one place.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + React |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Row Level Security | Supabase RLS |
| Hosting | Vercel |
| Version Control | GitHub |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/your-org/tikkit.git
cd tikkit
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Optionally run `supabase/seed.sql` for sample data

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
tikkit/
├── supabase/
│   ├── schema.sql          # Full database schema + RLS policies
│   └── seed.sql            # Dev seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Redirects to dashboard or login
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── callback/     # OAuth/email confirmation handler
│   │   └── dashboard/
│   │       ├── layout.tsx    # Sidebar + topbar shell
│   │       ├── page.tsx      # Overview
│   │       ├── events/
│   │       │   ├── page.tsx  # Events list
│   │       │   ├── new/      # Create event form
│   │       │   └── [id]/     # Event detail + guest list
│   │       ├── guests/       # Guests overview
│   │       ├── scan/         # QR scanner (Phase 2)
│   │       ├── vendors/      # Vendor & invoice management
│   │       └── analytics/    # Analytics dashboard
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── events/
│   │   │   └── EventActions.tsx
│   │   └── guests/
│   │       ├── GuestTable.tsx
│   │       └── QRModal.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # Browser Supabase client
│   │       ├── server.ts       # Server-side Supabase client
│   │       ├── middleware.ts   # Auth session management
│   │       └── database.types.ts  # Full TypeScript types
│   └── middleware.ts           # Route protection
```

---

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | Organizer/staff user profiles |
| `events` | Events with all settings |
| `ticket_types` | Ticket tiers per event |
| `guests` | Guest list with QR codes |
| `scan_logs` | Entry/exit scan history |
| `vendors` | Vendor directory |
| `vendor_invoices` | Invoice tracking per vendor |
| `discount_codes` | Promo codes per event |
| `waitlist` | Waitlist management |

---

## Phase Roadmap

- **Phase 1** ✅ Event creation · ticketing · QR check-in · organizer dashboard · vendor tracking
- **Phase 2** ✅ Real-time entry/exit scanning · crowd capacity management · waitlist · demographic ratio controls · analytics
- **Phase 3** 🔜 Automated vendor payouts · predictive analytics · hybrid events · social integrations

---

## Deploy to Vercel

1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Auto-deploys on every push to `main`