# Tikkit Launch Plan

Status: assessment, no code changed. Written 2026-10-14.

## 1. Product in one paragraph

Tikkit is the operating system for event organizers in Pakistan. Organizers sell QR based secure tickets, manage guest lists and approvals, run workshops and recurring classes with passes, manage their venue with time slots and QR reservations, track who sold what through referrals, and run the door on event day. Attendees need an account to buy anything. Organizers pay a subscription.

Two logins only: **Organizer** and **Attendee**. Gate staff and promoters get temporary token links, not accounts. Tikkit X management uses an internal admin console (`/master`), which is not a customer login.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Market | Organizers first, one market first. Pakistan only. |
| Artist Management | Killed. Code and tables removed after a data export. |
| Vendor X marketplace | Kept in code, gated, hidden from nav, sitemap and marketing. |
| Organizer vendor and invoice tracker | Kept inside the CRM as is. |
| Venues and Experiences | Folded into the organizer CRM. No separate venue login. |
| Workshops and classes | Folded into the CRM (one-off, recurring, pass packs). |
| Attendee account | Required to buy or register for anything. |
| Attendee signup | Email, phone, DOB, city, gender. |
| CNIC | Optional later step in a Verification tab, manual review, gives an "ID verified" check. |
| Didit | Removed. Manual CNIC review only. |
| Payments | Manual screenshot plus approval, unchanged. |
| Messaging | Removed. WhatsApp for support. Organizers publish WhatsApp and email on their profile. |
| Announcements | Kept. Organizers push updates to registered attendees. Also fires on location reveal. |
| Day of event | Scan, Verify, Command and Staff merge into one Event Day screen. |
| Guests, Approvals, Registrations | Merge into one guest list. |
| Gate staff | Temporary token access: scan and look up guests only. |
| Themes | Dark default, light mode toggle in Settings. Corporate and Pulse removed. |
| Guest score | Kept and made visible to organizers as social credibility. |
| Monetization | Organizer subscription. |
| Mobile app | Left in the repo, frozen, not shipped. |
| UI and copy | Full UI/UX overhaul. Copy rewritten, no em dashes, human tone. |
| New feature | Referral tracking with commissions, coupon codes and QR links. |

## 3. What the code looks like today (findings that shape the plan)

1. The three Tikkit X modules are already gated in `src/lib/supabase/middleware.ts` (`GATED_MODULES`). Removing or hiding them is low risk.
2. **Location reveal already exists in the schema** (`events.secret_venue`, `venue_reveal_at`, `venue_secret`). There is **no scheduler** (no `vercel.json`, no cron). Nothing fires a notification when the reveal time passes.
3. **Guest score already exists**: `guest_profiles.credit_score`, streaks, `total_attended`, `total_no_shows`, plus `credit_transactions` and `awardExitScanCredits` / `processNoShows`. It is just not surfaced to organizers.
4. **Discount codes exist** (`discount_codes`) but only the analytics page reads them. There is no creation UI and no attribution. The referral system builds on this table.
5. **Recurring classes and venue slots exist** in the venue module (`programmes` with an `rrule`, `programme_instances`, `programme_registrations`, `resources`, `slot_bookings`, `spot_maps`), but they are owned by a separate venue account and have no pass packs. Three separate QR token columns exist (`guests`, `programme_registrations`, `slot_bookings`).
6. The pricing page and its FAQ schema say "free forever, no fees". Terms, privacy and the home page repeat this. All of it conflicts with a subscription.
7. The canonical URL of every event page is `/guest/explore/[slug]`, inside the attendee namespace. `/register/[eventId]` has its own separate canonical. That is duplicate content, and the event URL is not a good permanent address.
8. The sitemap includes `/corporate`, `/pulse`, `/venue/home` and city and category landing pages (`/explore/[city]/[category]`, 8 cities by 10 categories). The city pages are real SEO assets. Corporate and Pulse are not.
9. Hosting is Vercel Hobby (from project notes). Hobby cron jobs run at most once per day, which is not enough for time-exact location reveals.
10. `guests` and `public_registrations` look like two models of one thing. They may be a pipeline (request, then admitted record) rather than true duplicates. This needs a code trace before we design the merge (see Phase 2).
11. `profiles.ui_theme` has a "collapse" migration (`20260920_collapse_ui_theme.sql`). The state of that collapse needs checking.
12. `/master` is one 3,500 line page. It needs splitting before it can be extended.

## 4. Target product

### 4.1 Organizer app (`/dashboard`)

```
Overview
Events            one-off events
Classes           workshops and recurring classes, with pass packs
Spaces            venue, bookable spaces, time slots, reservations
Guests            one unified list per event (requests, approved, checked in, waitlist)
Event Day         scanner, live count, guest lookup, announcements
Referrals         promoters, links, coupons, QR, commissions
Vendors           contacts and invoices (unchanged functionality)
Analytics
Settings          Profile, Public contact, Payment accounts, Team access, Verification, Subscription, Appearance
Help              WhatsApp
```

### 4.2 Attendee app (`/guest`, logged in)

```
Explore           personalized rail on top of the public browse
My tickets        events, class passes, reservations, all QR
Score             credibility score, streaks, verification
Notifications     announcements, location reveals, approvals
Profile           details, ID verification, appearance
```

### 4.3 Public site

Home, Explore (city and category pages), event pages, organizer pages, venue pages, Pricing, How it works, About, Contact, Blog, Compare, legal.

## 5. Feature specifications

### 5.1 Unified listings: events, classes, reservations

Three listing kinds, one organizer, one set of attendee flows.

| Kind | Example | Sells | Admission |
|---|---|---|---|
| Event | Rooftop party, 20 Dec | Ticket (tiers, VIP, discounted) | QR scanned at the door |
| Class series | Yoga Mon/Wed/Fri 7am | Drop-in, 10-class pack, monthly pass | QR per session, pass balance decrements |
| Reservation | Studio, table, court, 2pm slot | Time slot booking | QR scanned on arrival |

Data model direction:
- Organizer owns venues. `venues.owner_id` points to the organizer profile. The venue owner role and `/venue/os` portal go away.
- `programmes` becomes "Class series". Add `pass_products` (single, pack of N, monthly unlimited, validity days, price) and `pass_purchases` (balance, expiry) and `pass_redemptions` (one row per scanned session).
- `resources` becomes "Spaces". Keep `slot_bookings`.
- `spot_maps` and `spot_bookings` (seat and table maps): keep tables, hide the UI for v1.
- One scan endpoint resolves any QR token (ticket, class session, reservation) and returns a common shape. This replaces three code paths. Full table unification is explicitly not in scope for v1, because it is high risk and low user value.
- One "My tickets" view for attendees reads all three.

### 5.2 Referral and commission tracking

Goal: know who sold each ticket, and what commission is owed.

Entities:
- `referrers`: organizer-scoped promoter (name, phone, optional email). No account needed.
- `referral_links`: per event and referrer. Holds `code`, commission type (percent or fixed), commission value, optional buyer discount, optional cap and expiry.
- `discount_codes`: extended with `referrer_id` so a coupon can be attributed to a promoter.
- `registrations` (or `guests`/`public_registrations` until merged): add `referrer_id`, `referral_code_used`, `commission_amount`, `commission_status`.
- `commissions` ledger: accrued, approved, paid, voided, with `paid_at` and an organizer note (payouts are manual, like payments).

Commission rules are variable by design. There is no single default model. Configuration cascades: organizer default, then event default, then per promoter or per link override.
- Mode: tracking only (no commission), percent, fixed per ticket, or tiered (for example 5% for the first 20 tickets, 10% after).
- Base: ticket price actually paid, after any buyer discount.
- Buyer discount: optional per link, with a setting for who funds it (organizer, or deducted from the promoter's commission, or split).
- Limits: optional cap per promoter, per event, and an expiry date.
- Accrual: when the payment is approved. Payout is manual and recorded by the organizer, like payments.

Attribution:
- Link `/events/<slug>?ref=CODE` sets a 7 day cookie. A typed coupon code overrides the cookie. Last touch wins, coupon wins over cookie.
- Each referral link gets a QR image the promoter can show in person or put on a flyer.
- Commission accrues only when the payment is approved. If a registration is rejected or refunded, the commission is voided.
- Self-referral blocked (referrer phone or email equals buyer).

Surfaces:
- Organizer: Referrals page (promoter leaderboard, sales, commission owed and paid, export), per event referral setup, referral column in the guest list.
- Promoter: tokenized read-only page showing their code, QR, sales and commission. No login.
- Admin: platform-wide totals.

### 5.3 Unified guest list

One page per event, replacing Guests, Approvals and Registrations.

- Filters and tabs: Requests, Approved, Checked in, Waitlist, Rejected.
- Inline payment screenshot review with approve and reject.
- Columns: name, ticket type, payment status, referrer, guest score badge, ID verified check, check-in time.
- Bulk approve, bulk reject, add guest manually, Excel export (`exceljs` is already installed).
- Realtime counts, shared with Event Day.

### 5.4 Event Day

One screen, built for a phone at the door.

- Scanner (works offline, `syncOfflineCheckins` already exists), scan result cards (admitted, already used, not approved, wrong day).
- Live counters: expected, in, remaining, by ticket type.
- Guest lookup by name or phone for QR failures.
- Announcement composer.
- Staff link manager (see 5.7).

### 5.5 Announcements and location reveal

- New `event_announcements` table (event, author, body, created_at, channels).
- Publishing writes in-app notifications for approved attendees and sends an email via Resend. Mobile push uses the existing push token plumbing, but the mobile app is frozen, so v1 relies on in-app and email.
- Location reveal: the data already exists. Needed pieces:
  1. Server-side enforcement. The venue address is returned only when `now >= venue_reveal_at` and the viewer is an approved guest or the organizer. This needs an RLS and column exposure audit first, because `venue_secret` sits on the `events` table.
  2. A scheduler that runs every minute. Options: Supabase `pg_cron` with a SQL function, calling `pg_net` to hit a protected `/api/cron/reveal` route (works on Hobby), or Vercel Pro cron. Recommended: `pg_cron`.
  3. A `reveal_notified_at` column so each event fires once.
  4. Notification and email: "Location revealed for <event>".

### 5.6 Guest score (social credibility)

Keep the existing score and make it useful and fair.

- Organizer view: on each guest row, show a band (New, Reliable, Regular, Trusted), attended count, no-show count, and the ID verified check. Raw points stay private.
- Visible to an organizer only for people registered to that organizer's event.
- Attendee view: their score, streak and how it changes, plus a clear explanation.
- Terms and privacy must disclose that organizers can see attendance history for their events. Add a "report an error" path via WhatsApp.
- No-show processing already exists; it needs a scheduled run (same scheduler as 5.5).

### 5.7 Gate staff access

- `team_invites` is reduced to one role: gate staff.
- Each link is scoped to one event (or a list), expires automatically at event end plus a buffer, and can be revoked.
- Permissions: scan and guest lookup only. No payments, no exports, no PII beyond name, ticket type and status.
- Remove the `admin` and `manager` team roles and the RBAC migration surface.

### 5.8 Verification (manual)

- Remove Didit (`api/webhooks/didit`, `verificationActions`, `verifications` and `verification_sessions` tables, `didit_verification_id`).
- Keep the CNIC upload and review flow (`cnicActions`, admin approve and reject). Move it to a Verification tab for attendees and organizers.
- Attendees can verify later and get the check. Events may still set `require_id_verification`.
- Remove the CNIC and passport requirement from the signup gate. The gate becomes: email, phone, DOB, city, gender for attendees; company, phone, city for organizers.
- Add a `profile_complete` boolean maintained by trigger, to stop the middleware profile query on every navigation.
- Tesseract OCR is only used in `VerifyForm`; decide whether to keep client-side OCR as a helper or drop it to cut bundle weight.

### 5.9 Organizer subscription

**Launch markets:** Karachi, Lahore, Islamabad.

**Trial:** 14 days, no card. The trial runs at Growth level so organizers feel the features that matter, capped at 1 published event and 100 registrations to limit abuse. When it ends, the account becomes read-only (data and exports stay available) until they upgrade. A 7 day grace period applies after a paid period lapses.

**Payment (v1):** manual transfer to the Two Bit Digital account. The organizer picks a plan and period, sees the account details, uploads the transfer screenshot, and `/master` approves it, which activates the plan. Annual billing is encouraged because it halves the manual approval workload.

**Tiers (prices in PKR per month, excl. any tax):**

| | Starter 2,999 | **Growth 7,999 (recommended)** | Pro 12,999 |
|---|---|---|---|
| Who it is for | Occasional or first-time organizer | Active organizer, promoters, regular events | Agencies, venues, multi-brand teams |
| Published events per month | 3 | 10 | Unlimited |
| Registrations per event | 150 | 1,000 | Unlimited |
| QR tickets, approvals, guest list, Event Day | Yes | Yes | Yes |
| Gate staff links | 2 | 10 | Unlimited |
| Announcements to attendees | 2 per event | Unlimited | Unlimited |
| **Auto location reveal** | No (manual announcement only) | Yes | Yes |
| **Referral promoters and commission tracking** | 3 promoters, flat commission only | Unlimited promoters, percent, fixed and tiered commission, coupon codes, QR links | Everything in Growth plus commission statements (PDF) |
| Guest score | Band badge only | Full history (attended, no-shows, verified) | Full history plus repeat-guest insights |
| Vendor contacts and invoices | Up to 10 vendors | Unlimited | Unlimited |
| Analytics | Basic | Full, with Excel export | Full, plus per-promoter and per-city reports |
| Email blasts to attendees | None | 2,000 per month | 10,000 per month |
| Branding | "Powered by Tikkit" on tickets and event pages | Own logo and cover, no Tikkit badge on tickets | White-label tickets and pages, custom accent colour |
| Classes and workshops (v1.1) | 1 active series | 5 active series with pass packs | Unlimited |
| Spaces and reservations (v1.2) | 1 space | 3 spaces | Unlimited, multi-venue |
| ID-verified-only events | No | Yes | Yes |
| Support | WhatsApp, standard | WhatsApp, priority | WhatsApp, named contact, onboarding call |

**Annual pricing:** pay for 10 months, get 12. Starter 29,990, Growth 79,990, Pro 129,990 per year.

**Why Growth is the obvious middle choice:**
- Starter is deliberately tight. Anyone running more than 3 events a month, expecting more than 150 guests, or working with promoters outgrows it in the first month. Referral tracking is the feature that makes an organizer money, and it is capped at 3 promoters with flat commission only. Auto location reveal, the signature feature for private events, starts at Growth.
- Growth costs 2.7x Starter but gives 3x the events, 6.7x the guests, unlimited promoters, auto reveal, full guest score and full analytics. Per unit of value it is the cheapest plan.
- Pro costs 1.6x Growth and adds scale, white-label and multi-venue. Most organizers do not need those, which makes Growth feel like the safe, complete choice.
- Value framing on the pricing page: an organizer selling 300 tickets at PKR 2,000 handles PKR 600,000. Growth is about 1.3% of that, and one extra promoter-driven sale pays for several days of the plan.

**Implementation notes:**
- Tables: `plans`, `plan_limits` (limits stored as data, not code, so they can be tuned without a deploy), `organizer_subscriptions` (plan, status: trial, active, grace, expired, cancelled; `trial_ends_at`; `current_period_end`; billing period), `subscription_payments` (screenshot, amount, status, reviewed_by).
- One server-side `can(feature)` and `withinLimit(metric)` helper used by every create and publish action. The UI reads the same helper to show upgrade prompts at the moment of need.
- Invoices: no tax is collected. Each approved subscription payment generates a numbered invoice (PDF, issued by Two Bit Digital Ltd) that the organizer can download and that is emailed on approval. Table `subscription_invoices` with a sequential number.
- Pricing page, FAQ JSON-LD, terms and home copy are rewritten to match. Add a comparison table and an annual toggle.
- These limits are hypotheses. We should validate them with the first beta organizers in the three cities before locking them, and compare against Ticketwala and BookMe pricing, which I have not verified.

### 5.10 Master admin (`/master`)

Tikkit X management console. Keep and restructure:

- Overview: signups over time, active organizers, events, tickets sold, revenue (organizer sales, commissions, subscription).
- Organizers: list, status, subscription, verification, impersonate-free detail view.
- Attendees: signups, verification queue, score outliers.
- Events and registrations: oversight, takedown.
- Verification queue: CNIC review.
- Subscriptions: approve payments, extend, cancel.
- Categories, support log (WhatsApp links), audit log.
- Remove artist, management accounts and waitlist tabs.
- Split the single page into route segments with server components.

### 5.11 Theme

Dark default. Light mode toggle in Settings. Store preference in `profiles.ui_theme` (`dark` | `light`) and a cookie for flash-free SSR. Remove `corporate` and `pulse` CSS overrides, the picker's three-card UI, and the related landing pages.

## 6. SEO plan (do no harm)

Search Console data is not available for now, so redirects are conservative: only redirect duplicates of pages we keep (event URLs, `/register`, `/guest/explore`) and pages for products that no longer exist. Pages that might hold rankings (`/corporate`, `/pulse`, `/lp/underground`) are redirected last, one at a time, to the closest relevant page, with the old URLs monitored in Search Console once access is available.

| Today | Action |
|---|---|
| `/guest/explore/[slug]` (event detail, canonical) | New canonical `/events/<slug>`. 301 from the old URL. Keep slugs identical. |
| `/register/[eventId]` | 301 to `/events/<slug>`. Registration happens on the event page after login. |
| `/guest/explore` (public list) | 301 to `/explore`. Logged-in users see personalization on `/explore`. |
| `/explore`, `/explore/[city]`, `/explore/[city]/[category]` | Keep. Core programmatic SEO. Strengthen with real copy per city. |
| `/organizer/[username]` | Keep, add Organization and Event schema. |
| `/venue/[slug]`, `/venues` | Keep as public pages. Owner portal routes removed. |
| `/corporate`, `/pulse`, `/lp/underground` | 301 to `/` or `/pricing` after reviewing their traffic. |
| `/venue/home`, `/vendor/home`, `/artist-mgmt/home` | 301 to `/`. Remove from sitemap. |
| `/compare/*`, `/blog/*` | Keep. Rewrite copy. Drop blog categories `corporate` and `pulse`. |
| `/pricing` | Rewrite for subscription. Update FAQPage JSON-LD to match. |

Also: update `sitemap.ts`, `robots.ts`, `llms.txt`, JSON-LD (Event with `offers`, `eventStatus`, `location` hidden when secret), OpenGraph images, and the IndexNow submit script. Private and secret-venue events get `noindex` until reveal. Verify canonical, hreflang absence, and 301 chains in a crawl before and after.

## 7. UI/UX overhaul

Principle: do not reskin screens that are about to be merged or deleted. Cut first, then redesign what remains, rebuilding the merged screens in the new system.

1. **Design foundation.** Tokens for dark and light (color, type scale, spacing, radius, elevation, motion). One font pairing. A single icon set. Components: Button, Input, Select, Tabs, Table with sticky header and bulk select, Badge, Modal and Sheet, Toast, Empty state, Skeleton, Stat card, Command palette. Move from inline styles to Tailwind plus tokens, so theming and responsiveness stop being per-component work. The existing `design-system/` folder and CSS variables are the starting point.
2. **Prototype first.** Design the 8 anchor screens before coding: Overview, Create event, Guest list, Event Day, Referrals, Class series, Spaces, Attendee event page. Approve them, then build. Design tools are available in this environment (Stitch, Canva, Figma-style skills).
3. **Shells.** Organizer shell: collapsible sidebar, top bar with event switcher, `Cmd+K` palette, mobile bottom nav. Attendee shell: mobile-first, bottom tabs.
4. **Quality bar.** Loading, empty and error states on every screen, keyboard support, WCAG AA contrast in both themes, 375px to 1440px layouts, no layout shift, Lighthouse 90+ on public pages.
5. **Craft details that read as enterprise:** consistent table density, optimistic updates, undo toasts for destructive actions, real-time counters on Event Day, and skeletons instead of spinners.

## 8. Copy plan

- Positioning line to settle: for organizers, sell QR tickets, run your guest list and your venue.
- Pages to rewrite: Home, Pricing, How it works, About, Contact, Security, Terms, Privacy, Compare, Blog intros, meta titles and descriptions, JSON-LD, onboarding, emails, empty states.
- Rules: no em dashes anywhere, short sentences, say what the product does, concrete Pakistan examples, no "six modules / complete OS" language.
- Legal needs a lawyer's eye: subscription terms, commission handling, guest score disclosure, data retention, Pakistan data protection.

## 8b. Brand consistency: TIKKIT X

The product name is **TIKKIT X** in all user-facing text. Today the code base mixes "Tikkit" (about 396 occurrences in `src`), "TIKKIT X" and "Tikkit X", and there are three domains in use: `www.tikkitx.com` (canonical), `tikkitx.com`, and a stray `tikkit.app` (11 references).

Rules:
- Wordmark and headings: TIKKIT X. In running sentences: TIKKIT X as well, never "Tikkit" alone.
- Domain: `www.tikkitx.com` only. Replace every `tikkit.app` reference. Add a redirect for the apex domain.
- Code identifiers (cookie names, CSS classes, DB columns) are not renamed unless user-visible.
- Update: page titles and metadata, OpenGraph, JSON-LD (`name`, `alternateName`), emails, legal pages, PDFs, QR ticket design, notification text, the mobile `app.json` name, favicon and logo assets.
- Add a copy lint check in CI that fails on user-facing "Tikkit" without X and on em dashes.

## 9. Cut list by area

**Delete (after data export):**
- Artist Mgmt: `app/artist-mgmt`, `app/artists`, `components/artist`, `artistActions`, master tabs; tables `artists`, `artist_enquiries`, `artist_past_events`, `management_accounts`, `management_notifications`.
- Corporate and Pulse pages and `corporate_leads`; `lp/underground` after traffic review.
- Didit and verification tables (5.8).
- Messaging: `dashboard/messages`, `guest/messages`, command chat, guest chat, `event_chats`, `support_queries`, `support_messages`, `supportActions`, related API routes.
- Behaviour engine: `behaviourActions`, `user_behaviour_log`, `user_category_scores`, `upsert_category_score`. Keep `event_categories` as a filter.
- Wait lists for modules: `platform_waitlist`, `module_waitlist`, `moduleWaitlistActions`, `waitlistActions`. (`waitlist` for sold-out events stays.)
- Team roles `admin` and `manager`.
- Subdomain routing for vendor, venue and artist in middleware and the `.tikkitx.com` cookie scope, unless the product keeps a subdomain for any other reason.
- Root clutter: `check_role.js`, `revert_role.js`, `test_*.js`, `ts_errors.log`, `fix_payment_accounts_rls.sql`, `tmp/`, `SEO-REPORT.html`, the Word lock file, Sentry example page and API.

**Keep but hide (Vendor X marketplace):** `app/vendor`, `components/vendor`, `vendorXActions`, tables `vendors`, `vendor_bills`, `vendor_inventory`, `vendor_reviews`, `cross_hires`, `deals`. Keep the middleware gate. Remove from nav, sitemap, homepage and copy.

**Keep as is:** organizer vendor contacts and invoices (`organiser_vendor_contacts`, `organiser_vendor_invoices`, `vendorActions`, dashboard vendors page).

**Frozen:** `mobile/`. See risk 3 below.

**Rework (not delete):** venue module into organizer CRM; programmes into class series; resources into spaces; team invites into gate staff links; theme system; sign-up gate; `/master`.

## 10. Phases

Sizes are relative effort (S under 2 days, M 3 to 5, L 1 to 2 weeks), not calendar commitments.

### Phase 0. Safety and prep (S)
- Commit or stash the 108 modified files on a `pre-launch-snapshot` branch, tag it, and cut a `launch` integration branch.
- Full database export (schema and data) before the first migration. Staging project is deferred; migrations run on the current database one at a time.
- Add CI: type check, lint, build.
- Export Search Console data and Sentry baseline.
- Close the open questions in section 12.
- Exit: clean tree, backups verified, staging running.

### Phase 1. Cut (M)
- Delete everything in the delete list, gate and hide Vendor X, remove themes except dark and light, remove messaging UI and actions.
- Redirect map implemented (301s) but not yet pointing at final URLs where those are not built.
- Build and type check green.
- Exit: app builds, nav shows only the target IA, no dead links.

**Phase 1 status (done on branch `launch`):** Artist Mgmt, Corporate and Pulse pages, Didit, module and platform waitlists, subdomain routing, behaviour logging, in-app messaging and support tickets, and admin/manager staff links are removed. Vendor X and the venue portal are gated to the home page. Support is WhatsApp. `next build` passes. No database changes were made.
Deviations and carry-overs for later phases:
- Corporate and Pulse redirect to `/` with a temporary (307) redirect until final destinations are set.
- The theme code was already light/dark. The migration `20260920_collapse_ui_theme.sql` must be applied to the database in Phase 2, otherwise saving a theme fails the old check constraint.
- Mobile API routes for chat and support messages were kept so the frozen app keeps working against the unchanged database. Remove them together with the table drops in Phase 2.
- Event Day merge, unified guest list, `/events/<slug>` canonical and sidebar IA are Phase 4, not Phase 1.
- Legacy admin and manager staff links now show a "link no longer supported" page. Active gate staff links keep working.
- Homepage, blog and terms copy still mention the removed modules. Rewritten in Phase 6.

### Phase 2. Data model and types (M to L)
- Trace `guests` vs `public_registrations`, then decide: one `registrations` table with a status machine (pending payment, pending approval, approved, checked in, rejected, cancelled, waitlist), or keep the pipeline and formalize it.
- Migrations: drop cut tables, referral tables, commissions, `event_announcements`, `reveal_notified_at`, subscription tables, pass products and purchases, venue ownership move, `profile_complete`, theme collapse, gate staff scoping.
- RLS review for every new and touched table, including the `venue_secret` exposure.
- Regenerate `database.types.ts` after every migration (the build gates on types).
- Exit: staging DB at target schema, types green, RLS tests pass.

### Phase 3. Design foundation (M)
- Tokens, components, shells, light/dark. Prototype the 8 anchor screens and get approval.
- Exit: design system page, approved prototypes.

### Phase 4. Core organizer product (L)
Build in this order, each on the new UI:
1. Auth and signup (attendee and organizer), profile completion, Verification tab.
2. Public event page at `/events/<slug>` with registration after login, plus redirects.
3. Event create and edit.
4. Unified guest list.
5. Event Day, gate staff links, offline scanning.
6. Announcements and location reveal with the scheduler.
7. Referrals, coupons, QR links, commissions, promoter page.
8. Guest score surfaces.
9. Vendors and invoices (restyle only).
10. Analytics.
- Exit: an organizer can create, sell, approve, scan, announce and see commissions end to end.

### Phase 5. Subscription and admin (M)
- Plans, trial, feature gates, manual payment approval, pricing page.
- `/master` split and extended.
- Exit: a new organizer can sign up, pay, publish. Admin can see and act on everything.

### Phase 6. Public site, SEO, copy (M)
- New home, pricing, how it works, about, contact, security, legal, compare, blog.
- Sitemap, JSON-LD, redirects verified by crawl.
- Exit: crawl shows no 404s or redirect chains, structured data validates.

### Phase 7. Classes and spaces (L)
Recommended as a fast follow after launch, see recommendation below.
- Class series, recurrence, pass products, pass purchase, redemption by scan.
- Spaces, time slots, reservation with QR, calendar view.
- Unified scan endpoint and unified "My tickets".

### Phase 8. Hardening and beta (M)
- RLS and security review (use the security review skill), rate limits, payment flow tests.
- End-to-end tests for: signup, buy ticket, approve, scan, announce, reveal, referral commission, subscription gate.
- Load test of the public pages and the scanner.
- Sentry alerts, backups, runbook.
- Closed beta with 3 to 5 organizers in the launch city, then public launch.

## 11. Recommendation on sequencing

You want to reach the market quickly. I recommend launching **v1 with Events, unified guests, Event Day, announcements and reveal, referrals, guest score, vendor invoices, subscription, admin and the new UI**, and shipping **Classes (v1.1)** and **Spaces and reservations (v1.2)** right after. Reasons: events are the product most organizers already understand, classes and reservations each need new data model work (passes, slot logic) that would delay everything, and the consolidated architecture in 5.1 means they slot in without rework. If you want all three at launch, add roughly 2 to 3 weeks and move Phase 7 before Phase 8.

## 12. Open questions

Answered: launch cities are Karachi, Lahore and Islamabad. Trial is 14 days. Upgrades are manual transfers to the Two Bit Digital account. Tiers are PKR 2,999, 7,999 and 12,999 (section 5.9). Commission rules are variable (section 5.2). Brand is TIKKIT X everywhere. No tax is collected, and an invoice is issued per subscription payment. Account details come later. Work proceeds on the current database (see section 13 risk 1 and Phase 0).

1. **Organizer niche.** Which organizer type first (nightlife and private parties, workshops and yoga, corporate)? This decides the beta list, the copy and the SEO focus within the three cities.
3. **Tier limits.** Confirm or adjust the limits in section 5.9.
4. **Two Bit Digital account details** for the upgrade screen (bank, IBAN, JazzCash or EasyPaisa), plus who approves payments and how fast. To follow from you.
5. **Guest score visibility.** Bands only (my recommendation) or raw numbers? Opt-in for attendees?
6. **Hosting.** Stay on Vercel Hobby with Supabase `pg_cron` for schedules, or upgrade to Pro? Subscription revenue should cover Pro.
7. **Staging.** Deferred. We test on the current database. A new project comes later.
8. **Search Console.** Deferred. Redirects will be conservative (see section 6).
9. **Mobile.** Accept that frozen mobile will stop working against removed endpoints (messaging, waitlists) and be repaired later? My plan removes those routes in a separate commit so the change is easy to revert.
10. **Legal entity and terms.** Is Two Bit Digital Ltd the contracting party for subscriptions, and do you have a lawyer to review terms and privacy?

## 13. Risks

1. **Data loss on drops.** There is no staging project for now, so migrations run on the current database. You told us the existing data is small and not important, but we still export every table before dropping it, ship each drop in its own migration, and never edit an applied migration. A staging project should exist before real organizers are onboarded.
2. **Registration model merge** touches payments, QR, scanning and analytics (29 plus 43 files reference the two tables). Mitigation: trace first, migrate behind a compatibility view, end-to-end tests before switching.
3. **Mobile drift.** The frozen mobile app calls APIs we are removing. It stays in the repo and builds, but is not shipped until a dedicated pass.
4. **Secret venue leak.** `venue_secret` on a public-readable table could expose addresses early. Audit in Phase 2, before announcing the feature.
5. **SEO regression** from URL changes. Mitigation: GSC baseline, 301 map, crawl before and after, keep slugs unchanged.
6. **Scope creep.** The UI overhaul is the largest hidden cost. Mitigation: prototype 8 screens, build the design system once, no per-page redesigns outside the plan.
7. **Guest score fairness and legal exposure.** Mitigation: bands, disclosure, correction path.
8. **Manual payments at scale.** Screenshot approval is a bottleneck and a fraud surface. Acceptable for beta; revisit with a gateway after traction.

## 14. Execution rules

- One branch per phase off `launch`, merged via PR, build and type check must pass.
- Regenerate `database.types.ts` after every schema change.
- No `Co-Authored-By` lines in commits (breaks Vercel Hobby deployments, per project memory).
- No em dashes in any user-facing copy.
- Migrations: staging first, backup before, never edit an applied migration.
- Nothing is deleted from the repo until its replacement or its removal is agreed in this plan.
