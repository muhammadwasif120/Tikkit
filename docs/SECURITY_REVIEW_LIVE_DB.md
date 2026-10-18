# Live database security review (2026-10-14)

Scope: the current production Supabase project (`eyelcvclqzxhaaxyvgfu`). Review was read-only. A snapshot of the schema, 154 public policies, 26 storage policies, 23 functions, triggers, constraints and grants is in `supabase/baseline/live-2026-10-14/`. Findings below were confirmed with anonymous (public anon key) requests that printed counts only, never values.

All 52 public tables have row level security enabled and every one has at least one policy. That is the good baseline. The issues are in what the policies allow.

## High

| # | Finding | Evidence | Impact |
|---|---|---|---|
| H1 | **Organizer profiles are readable by anyone, all columns.** Policies `organizer_profiles_public_read` (role = organizer) and `profiles_public_read` (username not null) grant row access; column privileges are not restricted. | Anonymous request returned all 27 organizers with 27 emails, 15 phone numbers, 15 (encrypted) CNIC numbers and 1 CNIC image path. | Contact data of every organizer is scrapeable. Encrypted CNIC values and storage paths are exposed. |
| H2 | **Secret venue addresses are readable before reveal.** `venue_address` lives on `events` (the `venue_secret` column is only a boolean flag), and `events` has a public read policy for published events. | Anonymous request returned `venue_address` for a secret-venue event; 2 published events use secret venues. | Defeats the Auto Location Reveal feature and the private-event promise. |
| H3 | **Users can edit their own trust fields.** `profiles: own update` only forbids changing `role` (trigger `protect_profile_role`). `cnic_status`, `is_id_verified`, `social_score`, `admin_status` are editable by the owner. | Policy and trigger source. | Anyone can self-grant the "ID verified" check. |
| H4 | **Guest score is user-editable.** `guest_profiles: own update` has `with check (id = auth.uid())` and no column limits. | Policy source. | Users can set their own `credit_score`, streaks and attendance. Makes the score worthless as social credibility. |
| H5 | **Any organizer or staff user can insert score and pass records for any guest.** `credit_transactions: staff insert` and `event_passes: staff insert` only check role. `scan_logs: staff insert` likewise. | Policy source. | Organizers can mint or tamper with another person's score and passes. |

## Medium

| # | Finding | Impact |
|---|---|---|
| M1 | `team_invites_public_read_by_token` is `using (true)`: every invite token can be listed by anyone. | Any active gate staff link can be harvested from the public API. Today both rows are expired, so nothing is exploitable yet. |
| M2 | `guest_profiles: organizer read registered` joins `auth.users`. Roles that cannot read `auth.users` get "permission denied for table users" when the policy is evaluated. | Anonymous reads of `guest_profiles` error out; organizers likely cannot read guest scores reliably. Blocks the planned organizer view of guest credibility. |
| M3 | `spot_bookings_public_read` is `using (true)`, exposing `user_id` of bookings. | Minor privacy leak (table empty today). |
| M4 | The default Supabase table grants give `anon` full privileges on all 52 tables. RLS is the only barrier. | One bad policy exposes a table. Fresh project should revoke and grant explicitly. |
| M5 | Many dead-module tables carry policies (artists, management, vendors marketplace, waitlists, chats, behaviour log). | Needless attack surface. |
| M6 | Several policies are written with the `public` role instead of `authenticated`. | Anonymous users evaluate policies they should never reach. |

## Design rules for the fresh policies (new project)

1. Revoke all default privileges from `anon` and `authenticated`, then grant per table and per column. Anonymous gets read on explicitly public views only.
2. **Split personal data from public data.** `profiles` holds only public fields (name, username, avatar, company, city, bio). A separate `profile_private` table holds email, phone, ID numbers, ID image paths, DOB, gender. Only the owner and admin read it; organizers see a guest's details through a view limited to their own event's registrants.
3. **Trust fields are written only by the server** (service role or security definer functions): `is_id_verified`, ID status, score, streaks, subscription status, commission amounts. Users cannot update them, enforced by column privileges and not only by trigger.
4. **Secret venue data lives in its own table** (`event_secrets`) readable only by the organizer and by approved registrants once `reveal_at` has passed.
5. Gate staff and promoter tokens are validated through security definer functions that take a token and return only what that role needs. No table that stores tokens is readable by clients.
6. Score and pass writes happen in security definer functions called from server actions after the scan is validated. No direct insert policies.
7. Public data (published events, ticket types, organizer public profile, categories) is served through views or columns that exclude anything private.
8. Every table gets a test: anon, attendee, organizer owner, other organizer, gate staff, admin. A test script runs before every cutover.
9. Use `authenticated` or `anon` in policy role lists, never the default `public`. Avoid policies that reference `auth.users`; mirror what you need into `profile_private`.

## Recommended hotfix on the live project

H1, H2 and H3 are exploitable today. Fixing them on production is a small, separate change from the rebuild. It needs a code change and a database change in a fixed order (code first, then database), so it should be approved before it is done. Proposed scope:

- Column-level privileges: revoke `select` on email, phone, ID columns, `venue_secret` from `anon` and `authenticated`; serve the app's needs through the existing security definer RPCs.
- Trigger extension to block self-editing trust fields.
- Replace the `team_invites` public read with a token lookup function.
- Tighten `guest_profiles` / `credit_transactions` / `event_passes` writes.

Everything is also applied in the fresh baseline for the new project.


## Status

All items above are addressed in the rebuilt schema (`supabase/migrations/20261015*`) and covered by `supabase/tests/01_security.sql` (87 checks, all passing). The old policies no longer exist on the development database, which was rebuilt in place on 2026-10-15.
