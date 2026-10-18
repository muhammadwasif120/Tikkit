# Production readiness audit, 18 Oct 2026

Scope: the whole Next.js app, the live Supabase schema and policies as defined by the migrations, the demo accounts, dependencies and the build.

## What was checked

| Area | Result |
| --- | --- |
| Type check and production build | Pass (`next build`, Next 15.5.28) |
| Lint | No security or hook-rule findings. Remaining: 72 cosmetic apostrophe warnings in prose |
| Dependencies | The critical Next.js denial of service is fixed. Remaining 8 findings are build-time only (see Accepted risks) |
| Secrets in the repo | None. `.env*` are ignored. The one key-looking value in `mobile/.env.example` is a truncated placeholder |
| Route protection | Logged-out probes of `/guest`, `/dashboard`, `/master`, `/vendor`, the cron route, IndexNow and the calendar export all refuse correctly |
| Security headers | CSP (framing, base tag, object, form action), HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP |
| Auth redirects | `next` parameter is same-site only in the callback and login screen |
| Admin gate | `profiles.role` only, never user metadata |

## Fixed in this audit

1. **Dead code removed.** The unfinished Vendor X portal (pages, components, a 450 line server actions file against a table that does not exist) and the Sentry example page and API route (a route that throws on every request) are deleted. Server actions are public endpoints, so unused ones are attack surface.
2. **IndexNow route rewritten** for the new schema. It was querying columns that no longer exist, had an unauthenticated listing endpoint, and compared the secret with `!==`. It is now POST only with a constant-time secret check.
3. **Cron route** compares its secret in constant time.
4. **Admin ID reveal is now audit logged.** The comment said it was; the code did not. A reveal is refused if the log write fails, and is rate limited.
5. **ID document path** must be `<own user id>/<uuid>.<jpg|png|webp>`. The old prefix check allowed `..` segments.
6. **Receipt and proof paths** are checked in the database on `payment_submissions`, `product_payments` and `subscription_payments`: a signed-in user may only reference files in their own folder.
7. **Organizer links.** `javascript:` and `data:` URLs can no longer be stored or shown: database constraint on `organizer_profiles.website`, validation in the profile form, and sanitising at render. Instagram handles are validated.
8. **Middleware.** `/guest/explore` (now a logged-in page) is no longer on the public list. Dead public paths removed.
9. **Rate limits** on demo sign-in, the email flush action and ID reveals.
10. **Collectibles and For you** read only the signed-in user's rows (row level security). `my_collectibles()` is not callable anonymously.
11. **A fabricated claim removed.** The underground landing page quoted an "offline QR check-in" that does not exist.
12. **Email sender** was not scheduled anywhere. `vercel.json` now runs it daily as a safety net (Vercel Hobby allows daily crons only). Actions also flush it directly.
13. **Guests could not read the class, session, pass or space behind their own bookings.** Policies added (a real functional bug, not only the demo).

## Demo account hardening (database level)

The demo accounts are shared and anyone can sign into them. These rules run in the database, keyed to the demo flag in the session token, so a hand-made request cannot bypass the app:

* email to demo addresses or from a demo session is never sent
* demo content is forced to unlisted, so it can never appear in public listings or the sitemap
* no username, avatar or public organizer page edits
* no team invites, plan payments or ID verification changes
* uploads limited to the private receipts bucket
* row caps on events, referrers, vendors, classes, spaces, retreats, payment accounts and gate links
* data rebuilt nightly and on request (one minute cooldown)

## Accepted risks (documented, low)

* **Build-time dependency findings**: PostCSS inside Next (only matters when stringifying untrusted CSS), `exceljs`/`uuid` (not used with a caller supplied buffer), `gray-matter`/`js-yaml` (parses your own blog files). None can be reached by a visitor. Revisit when Next ships a release that bumps its bundled PostCSS.
* **Demo receipts**: a demo session can upload receipt images up to the bucket limit (10 MB) into a private bucket. They are not public and are not cleaned automatically.
* **`flushEmails` is callable by any signed-in user.** It only processes the existing queue and is rate limited.
* **CSP has no script restrictions** because Next and the JSON-LD blocks use inline scripts. Adding a nonce based policy is a larger change.
* **External cover image URLs** are loaded with plain `<img>` and can point at other hosts. This is an IP-leak risk to the viewer, not code execution.

## What you must do (cannot be done from here)

1. Apply `supabase/migrations/20261018000002_demo_hardening.sql`.
2. Run `supabase/tests/04_verify_applied.sql`. No rows means every migration is applied.
3. Run `supabase/tests/05_security_audit.sql`. No `PROBLEM_` rows is the goal. Read the `REVIEW_` rows and confirm they match what you expect.
4. Production environment variables. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CNIC_ENCRYPTION_KEY` (64 hex characters), `CRON_SECRET`, `INDEXNOW_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL=https://www.tikkitx.com`, `NEXT_PUBLIC_BILLING_ACCOUNT`, the Sentry variables, and the Upstash or KV pair for shared rate limits (without it limits are per server instance). Optional: `DEMO_ENABLED=1`. **Must not be set:** `NEXT_PUBLIC_DESIGN_PREVIEW`.
5. Supabase dashboard (Authentication): "Confirm email" on, minimum password length 8 or more, leaked password protection on, Site URL and redirect allow-list limited to your domains, Google provider using your own client, CAPTCHA or stricter rate limits on sign up if you see abuse, and a strong password plus MFA on every admin account.
6. Regenerate `src/lib/supabase/database.types.ts` after applying the migrations (new table `attendee_interests`, new functions).
7. Lawyer review of terms and privacy, as before.
