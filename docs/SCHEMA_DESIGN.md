# TIKKIT X baseline schema design (new Supabase project)

Status: **implemented** as ten migrations in `supabase/migrations/20261015*`, applied to the development database and covered by `supabase/tests/01_security.sql`. Differences from the first draft are listed in section 10. Written from the live schema snapshot (`supabase/baseline/live-2026-10-14/`), the app code, and `docs/SECURITY_REVIEW_LIVE_DB.md`.

## 1. Finding from the registration trace

`guests` and `public_registrations` are not a clean pipeline. `registerForEvent` writes a row to each with no link between them, and `guests` also holds manually added and invited people. In the live data, 9 people exist in both, 3 only in `guests`, 13 only in `public_registrations`. No guest row has a QR token or a guest profile id. 29 plus 43 files reference the two tables.

Decision: **one `registrations` table** is the single record of an attendee's relationship to an event. Source is a column (`self`, `invited`, `manual`), not a separate table.

## 2. Principles

1. Public data and private data are different tables. No table mixes them.
2. Trust fields (verification, score, subscription state, commission, check-in) are written only by security definer functions or the service role.
3. Anonymous and authenticated roles get no default table privileges. Every grant is explicit, per table and per column.
4. Secrets (venue address, reference code) have their own table with strict reads.
5. Tokens (gate staff, promoter) are stored as hashes and checked by functions. No client can list them.
6. Every status is a Postgres enum with a documented state machine.
7. Every table has `created_at`; mutable tables have `updated_at` via one shared trigger.
8. Money is stored as integer PKR (no decimals) in `*_pkr` columns.

## 3. Tables (v1 launch)

### Identity
| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id (= auth.users.id), role (`organizer`,`attendee`,`admin`), full_name, username (unique), avatar_url, city, country, ui_theme (`dark`,`light`), created_at | Public-safe only. Role is immutable for clients. |
| `profile_private` | id, email, phone, date_of_birth, gender, id_type (`cnic`,`passport`), id_number_enc, id_image_path, id_status (`none`,`pending`,`verified`,`rejected`), id_submitted_at, id_reviewed_by, id_reject_reason | Owner reads own. Admin reads all. Organizers read a registrant's name, phone and verified flag only through a view limited to their events. |
| `organizer_profiles` | id, company_name, bio, logo_url, cover_url, whatsapp, contact_email, instagram, website, public_contact (bool) | Public. Organizer-controlled contact info replaces in-app messaging. |
| `attendee_stats` | id, score, tier, attended, no_shows, streak, longest_streak, updated_at | Server-written. Readable by owner and by organizers for their registrants. |
| `score_events` | id, attendee_id, event_id, delta, reason, created_at | Ledger behind the score. Server-written. |

Signup requires, by role: attendee email, phone, DOB, city, gender; organizer company, phone, city. The ID step is optional and later, and gives the verified check.

### Billing (organizer subscription)
| Table | Key columns |
|---|---|
| `plans` | id (`starter`,`growth`,`pro`), name, price_pkr_month, price_pkr_year, sort |
| `plan_limits` | plan_id, key (e.g. `events_per_month`, `registrations_per_event`, `gate_staff_links`, `promoters`, `auto_reveal`, `email_blasts`), value (jsonb) |
| `organizer_subscriptions` | organizer_id, plan_id, status (`trial`,`active`,`grace`,`expired`,`cancelled`), trial_ends_at, current_period_start, current_period_end, billing_period (`month`,`year`) |
| `subscription_payments` | id, organizer_id, plan_id, period, amount_pkr, screenshot_path, status (`submitted`,`approved`,`rejected`), reviewed_by, reviewed_at |
| `subscription_invoices` | id, number (sequential), organizer_id, payment_id, amount_pkr, issued_at, pdf_path |

### Events
| Table | Key columns | Notes |
|---|---|---|
| `event_categories` | id, name, slug, icon, color, sort | Seeded (14). |
| `events` | id, organizer_id, slug (unique), title, description, cover_image_url, category_id, tags[], city, area_label (public, e.g. "DHA Phase 6"), venue_name (public only when not secret), starts_at, ends_at, capacity, ticket_days, status (`draft`,`published`,`completed`,`cancelled`,`archived`), visibility (`public`,`private`), registration_mode (`open`,`approval`), require_id_verified, gender ratio fields, admin_status (`live`,`flagged`,`suspended`) | No secret columns. Public view excludes drafts and private events. |
| `event_secrets` | event_id, venue_address, venue_notes, reveal_at, reveal_notified_at, reference_code | Readable by organizer, admin, and approved registrants after `reveal_at`. |
| `ticket_types` | id, event_id, name, price_pkr, quantity, sold, is_vip, sales_start, sales_end | `sold` maintained by the registration functions. |
| `event_announcements` | id, event_id, author_id, body, send_email, created_at | Fans out to `notifications`. |

### Registration, payment, door
| Table | Key columns | Notes |
|---|---|---|
| `registrations` | id, event_id, attendee_id, ticket_type_id, source (`self`,`invited`,`manual`), status (see below), full_name, phone, email, ticket_days, plus_one, notes, price_due_pkr, discount_pkr, price_paid_pkr, referrer_id, coupon_id, referral_code_used, qr_token (random, unique), approved_at, checked_in_at, created_at | Unique (event_id, attendee_id) for non-rejected rows. Manual/invited rows may have a null attendee until claimed. |
| `payment_accounts` | id, organizer_id, method (`bank`,`jazzcash`,`easypaisa`,`other`), account_title, account_number, bank_name, notes | Organizer private. |
| `event_payment_accounts` | event_id, payment_account_id | Which accounts an event accepts. |
| `payment_submissions` | id, registration_id, screenshot_path, reference, amount_pkr, status (`submitted`,`approved`,`rejected`), reviewed_by, reviewed_at, reason | Screenshot in private bucket. |
| `scan_logs` | id, event_id, registration_id, scanned_by_user, gate_link_id, result (`admitted`,`duplicate`,`not_approved`,`wrong_day`,`invalid`), offline_synced, scanned_at | Written by `check_in` only. |
| `gate_staff_links` | id, organizer_id, event_ids[], label, token_hash, expires_at, revoked_at, last_used_at | Token shown once at creation. |

Registration status machine:
`requested` (approval events) → `awaiting_payment` → `payment_submitted` → `confirmed` → `checked_in`.
Side exits: `rejected`, `cancelled`, `waitlisted` → `awaiting_payment`, `no_show` (set after the event). Free events skip payment states. Invited guests start at `confirmed`.

### Referrals and commissions
| Table | Key columns |
|---|---|
| `referrers` | id, organizer_id, name, phone, email, access_token_hash, created_at |
| `referral_links` | id, event_id, referrer_id, code (unique per event), commission_mode (`none`,`percent`,`fixed`,`tiered`), commission_value, commission_tiers (jsonb), buyer_discount_type, buyer_discount_value, discount_funded_by (`organizer`,`referrer`,`split`), max_uses, expires_at |
| `coupons` | id, event_id, code, discount_type, discount_value, max_uses, uses, expires_at, referrer_id (nullable) |
| `commissions` | id, registration_id, referrer_id, amount_pkr, status (`accrued`,`approved`,`paid`,`void`), paid_at, note |
| `organizer_commission_defaults` | organizer_id, mode, value, tiers (jsonb) | Cascade: link overrides event default overrides organizer default. |

Accrual happens when a payment is approved (trigger inside `approve_payment`). Rejection or cancellation voids the commission.

### Organizer CRM extras
| Table | Notes |
|---|---|
| `organizer_vendors` (was `organiser_vendor_contacts`) | Kept as is: contact, category, notes. |
| `organizer_vendor_invoices` | Kept as is: amount, due date, status, paid_at. |
| `organizer_favourites` | user_id, organizer_id. |
| `notifications` | user_id, type (text), title, body, event_id, metadata, read_at. Insert only through functions. |
| `push_tokens` | Kept for the frozen mobile app. |
| `admin_audit_log` | actor, action, entity, entity_id, details, created_at. |

## 4. Deferred modules (separate migrations, not in the first baseline)

- **v1.1 Classes:** `class_series` (rrule, capacity, price), `class_sessions`, `pass_products` (drop-in, pack of N, monthly), `pass_purchases` (balance, expiry), `pass_redemptions` (one per scan).
- **v1.2 Spaces:** `venues` (owned by an organizer), `spaces`, `space_slots` or availability rules, `space_bookings` with QR token. Seat/table maps later.
- **Vendor X marketplace:** `vendors`, `deals`, `cross_hires`, `vendor_bills`, `vendor_inventory`, `vendor_reviews`, `invoices`. Recreated only if and when that module launches.

Not recreated: artists, management accounts, Didit verification tables, chats, support tables, behaviour log and category scores, waitlists, corporate leads, event ledger, offline check-in queue (replaced by `scan_logs.offline_synced`).

## 5. Functions (security definer unless noted)

| Function | Purpose |
|---|---|
| `handle_new_user()` trigger | Creates `profiles`, `profile_private`, role-specific rows, 14 day trial for organizers. |
| `set_updated_at()` trigger | Shared. |
| `generate_event_slug()` trigger | Unique slug from title. |
| `register_for_event(event, ticket_type, referral_code, coupon_code, ...)` | Atomic: validates window, capacity, duplicates, ID requirement, subscription limits; creates the registration; applies referral and coupon. |
| `submit_payment(registration, screenshot_path, reference)` | Creates the submission, moves status. |
| `review_payment(submission, approve, reason)` | Organizer only for own events. Updates status, accrues commission, issues the QR, sends notification. |
| `review_registration(registration, approve)` | For approval-mode events. |
| `check_in(token, event, gate_link)` | Validates token, day, status; writes `scan_logs`; updates status; awards score. |
| `get_event_secret(event)` | Returns address only if caller is organizer/admin or an approved registrant after `reveal_at`. |
| `reveal_due_events()` | Called every minute (pg_cron). Sets `reveal_notified_at`, creates notifications, queues email. |
| `process_no_shows()` | After an event ends, marks no-shows and writes score events. |
| `award_score(attendee, event, delta, reason)` | Only caller is other functions. Recomputes `attendee_stats` and tier. |
| `publish_announcement(event, body, send_email)` | Organizer only, fans out notifications. |
| `get_gate_link(token)` / `check_in` via link | Validates a gate staff token and returns minimal event data. |
| `get_promoter_dashboard(token)` | Returns a promoter's code, sales and commission. |
| `plan_allows(organizer, key)` and `within_limit(organizer, key)` | Used by create/publish functions and by the UI. |
| `get_public_organizer(username)` | Public organizer page data from `profiles` + `organizer_profiles`. |
| `master_analytics()` | Admin dashboard numbers. Admin only. |

## 6. Row level security summary

| Table group | Anon | Attendee | Organizer | Gate staff | Admin |
|---|---|---|---|---|---|
| `profiles`, `organizer_profiles`, `event_categories`, published `events` and `ticket_types` (via views) | read public columns | read | read, edit own | none | all |
| `profile_private` | none | own | own | none | all |
| `event_secrets` | none | via function only | own events | none | all |
| `registrations` | none | own | rows for own events | via function only | all |
| `payment_submissions` | none | own | rows for own events | none | all |
| `scan_logs`, `attendee_stats`, `score_events`, `commissions` | none | own stats | own events | none (function writes) | all |
| `referral_*`, `coupons` | coupon validation via function | none | own | none | all |
| `gate_staff_links`, `referrers` token hashes | none | none | own, no hash | none | all |
| Billing tables | none | none | own | none | all |

No direct insert/update policies on trust tables. Each table has an automated policy test run against anon, attendee, organizer owner, another organizer, gate staff and admin.

## 7. Storage buckets

| Bucket | Visibility | Contents | Rule |
|---|---|---|---|
| `event-media` | public read | event covers, organizer logos and covers, avatars | Owner writes to own folder, size and mime limits. |
| `payment-proofs` | private | registration payment screenshots | Attendee writes own, organizer reads for own events, signed URLs. |
| `id-documents` | private | ID images | Owner writes, admin reads, signed URLs, watermarked on upload (existing behaviour). |
| `subscription-proofs` | private | organizer subscription screenshots | Owner writes, admin reads. |

## 8. Data import mapping

| Old | New |
|---|---|
| `auth.users` (42) | Re-created with the same email (id preserved if the admin API accepts it, otherwise mapped). Users set a new password or use Google. |
| `profiles` (27 organizers, 13 attendees, 1 admin) | `profiles` + `profile_private` + `organizer_profiles`. CNIC data re-encrypted only if the key is unchanged; otherwise copied as-is with the same `CNIC_ENCRYPTION_KEY`. |
| `events` (20) | `events` + `event_secrets`. `ticket_price` becomes a default ticket type if none exists. |
| `ticket_types` (19) | `ticket_types`. |
| `public_registrations` (22) + `guests` (12) | `registrations`, merged by (event, email); `source` set by origin. Payment fields move to `payment_submissions`. |
| `payment_accounts` (11), `event_payment_accounts` (9) | Same. |
| `organiser_vendor_contacts` (5), `organiser_vendor_invoices` (9) | `organizer_vendors`, `organizer_vendor_invoices`. |
| `guest_profiles` (4) | `attendee_stats`. |
| `scan_logs` (9), `notifications` (41) | Imported; notifications optional. |
| `event_categories` (14) | Seed. |
| Not imported | chats, behaviour data, support tables, artists, management, waitlist, test rows. The single platform waitlist row is exported to the outreach list. |

Import is a script with a dry-run mode that reports expected row counts per table, run first against an empty database.

## 9. Open items for the schema

1. Confirm whether the 20 events and 22 registrations include test data to skip.
2. Confirm ID verification is optional for both roles at signup, with organizers required to verify before their first publish (current behaviour).
3. Decide whether gate staff links are scoped to specific events (recommended) or all of an organizer's events.
4. Decide sales cutoff behaviour: `sales_end` per ticket type, or only event start.

## 10. As built (differences from the draft)

- `events.venue_address` is a public column for normal venues. It is forced to null by trigger when `is_secret_venue` is true, and the real address then lives in `event_secrets`.
- Coupons carry no referrer. A referral link's code acts as the buyer coupon when it has a discount, so attribution stays in `referral_links`.
- `ticket_types` has no `sold` counter. Seats are counted from registrations, serialized by a row lock on the event inside `register_for_event`.
- Added: `email_outbox` (announcement and reveal emails, sent by a server route), `organizer_commission_defaults`, `private` schema helpers, `get_registrant_scores()` (plan-aware score detail for organizers), `process_no_shows()` also archives events 72 hours after the end.
- Trial is a pseudo plan (`trial`) with its own limits: 1 event, 100 registrations, Growth features.
- `registration_mode` is `open` or `approval` (legacy "expression of interest" and "invite only" both map to `approval`; invite only also becomes a private, unlisted event).
- pg_cron jobs: `tkx_reveal_due_events` every minute, `tkx_process_no_shows` hourly. The legacy auto-archive job was removed.
- Replay on a fresh project: link it, then `supabase db push` applies `supabase/migrations/*` in order. `supabase/dev/00_reset_legacy_public.sql` is only for wiping the old development schema and is never needed on a new project.
- Import: `scripts/import_legacy.py` plus `scripts/copy_legacy_storage.mjs`, run against the export in `~/tikkit-backups`.

## 11. Modules migration (20261016): classes, spaces, retreats, team access

Five additive migrations. Nothing from the 20261015 baseline is dropped or renamed. Same rules as the baseline: deny by default, explicit grants, trust data changes only in security definer functions, limits stored as data in `plan_limits`.

| Migration | Contents |
|---|---|
| `20261016000001_platform_extras` | `organizer_team_members` (invite, claim, remove), `private.manages_org` and a team aware `private.manages_event`, `event_favourites`, `product_payments` (proof of payment for passes, drop ins and space bookings), `door_scans`, gate link scope columns for classes, spaces and retreats |
| `20261016000002_classes` | `class_series` (weekly pattern in Pakistan local time), `class_sessions` (generated 12 weeks ahead), `pass_products` (pack or monthly), `pass_purchases`, `class_bookings`, `pass_redemptions`, public views, `book_class_session`, `purchase_pass`, `cancel_class_booking`, `cancel_class_session`, `process_class_sessions` |
| `20261016000003_spaces` | `spaces`, `space_hours` (weekly slot grid), `space_blackouts`, `space_bookings`, `space_open_slots`, `book_space` (row lock prevents double booking), `review_space_booking`, `cancel_space_booking`, `process_space_bookings` |
| `20261016000004_retreats` | `retreats`, `retreat_days`, `retreat_items`, `retreat_participants`, `retreat_checkins`, `retreat_budget_lines`, `retreat_tasks`, `retreat_updates`, `retreat_documents`; sharing by private link, participant itinerary by QR token, `retreat_check_in`, `post_retreat_update`, `duplicate_retreat`, `retreat_summary` |
| `20261016000005_modules_flows_rls` | `submit_product_payment` and `review_product_payment`, `scan_any` and `gate_scan_any` (one token, any product), `create_gate_link_scoped`, `gate_get_scope`, `my_entitlements` with module usage, `master_modules_overview`, RLS and grants for every new table, plan limits, `retreat-files` bucket, pg_cron jobs |

### Decisions
- **Statuses reuse `registration_status`** for class bookings and space bookings, so the approval, payment and check in states match events.
- **Payments:** event tickets keep `payment_submissions`. Everything else uses `product_payments` keyed by `(kind, subject_id)`. Rejecting a proof returns the subject to `awaiting_payment`.
- **Classes:** recurrence is `weekdays` plus `interval_weeks`, not an RRULE. A pass reserves a session at booking and gives it back if cancelled with at least two hours notice or if the organizer cancels. Attending creates a `pass_redemptions` row and awards guest score. Confirmed bookings of finished sessions become no shows hourly.
- **Spaces:** `book_space` locks the space row and re-checks the slot, so two people cannot take the same time. `buffer_minutes` is held after each booking.
- **Retreats (Pro only, `plan_limits.retreats`: 0, 0, 0, -1):** private to the organizer account. The shared itinerary and the participant itinerary are served by functions that omit internal items, costs, notes and participants. Participants can be linked to accounts by email (`claim_retreat_invites`).
- **Team access:** one role, `manager`. A manager can do everything the owner can through functions and read policies, but direct writes to events still need ownership. Plan limit `team_members`: trial 2, starter 0, growth 3, pro unlimited. The app must also let team managers into `/dashboard` (the role check in middleware is by `profiles.role`).
- **Not included:** Vendor X marketplace tables, seat or table maps. Both stay deferred.

### Verify after applying
```
supabase db query --linked -f supabase/tests/02_modules_security.sql   # self rolling back, prints PASS or FAIL per check
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```
