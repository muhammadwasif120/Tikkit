# Store privacy declarations — reference

Source-of-truth for filling out **Apple's App Privacy** questionnaire (App Store
Connect → App Privacy) and **Google's Data Safety** form (Play Console → App
content → Data safety). Everything below is derived directly from what the
mobile app code actually does — grep the referenced files if anything here
looks stale before submitting either form.

Covers the `xyz.tikkit.app` binary only (`mobile/`). The web app is a
separate listing surface with its own privacy page (tikkit.xyz/privacy).

---

## 1. Data collected

| Data type | Fields | Where in code | Purpose |
|---|---|---|---|
| **Account credentials** | email, password | `AuthContext.signUp/signIn` | App functionality (auth) |
| **Name** | full name | signup flow, `profiles.full_name` | App functionality, shown to organizers/guests |
| **Phone number** | phone | signup (optional), `profiles.phone_number` | App functionality (organizer contact, guest registration) |
| **Physical address (coarse)** | city (self-selected from a list, not GPS) | signup (optional), `profiles.city` | Personalization (event discovery) |
| **Other user IDs** | username | `profiles.username` | App functionality (public handle) |
| **Photos** | payment screenshot (camera or photo library) | `registrations.tsx` → `submitPaymentScreenshot`, `expo-image-picker` | App functionality (manual payment verification by organizer) |
| **Photos** | QR code frames | `scan.tsx`, `expo-camera` | Read in real time to decode a QR token; **not stored or uploaded** — no image is captured or persisted |
| **User content** | bio, Instagram handle | `guest_profiles.bio/instagram_handle` | Profile personalization (guest role only) |
| **App activity** | event registrations, check-in status, favourites, social credits/tier | various `/api/mobile/*` calls | Core app functionality |
| **Push token** | Expo push token | `usePushNotifications.ts` → `registerPushToken` | Push notifications (registration updates, payment reminders, event reminders) |
| **Diagnostics** | crash/error reports | `src/lib/sentry.ts` (Sentry) | Stability monitoring — **inactive unless `EXPO_PUBLIC_SENTRY_DSN` is set** at build time |
| **Third-party guest data** | name, email, phone, gender of *other people* an organizer manually adds | `guests.tsx`, `events/[id]/guests/add.tsx` | Organizer's own guest-list management — this is the organizer's data to manage, not collected from the data subject directly by the app |
| **Vendor contact data** | vendor/contact name, email, phone | `vendors.tsx` | Organizer's own vendor-management tooling |

### Not collected
- **Precise location / GPS** — not requested, no location permission in `app.json`.
- **Contacts** — no contacts permission requested.
- **Advertising ID / ad tracking** — no ad SDK present.
- **Browsing history, search history outside the app** — not collected.
- **Financial account numbers** — payment is handled as a manual screenshot review workflow; the app does not collect card/bank account numbers directly (screenshots may incidentally contain payment app UI at the user's discretion — see note below).
- **Health, biometric, or genetic data** — not collected.

> **Note on payment screenshots**: the screenshot a guest chooses to upload
> may visually contain bank/payment-app details as a side effect of what
> they photograph. The app does not parse, OCR, or extract structured
> financial data from it — treat it as "photos" for the form, not
> "financial info," but disclose that the image *may* contain payment
> details incidentally.

---

## 2. Purpose of collection (map to Apple's / Google's purpose categories)

- **App functionality** — auth, registrations, check-in, notifications, profile.
- **Personalization** — city/interests used to tailor the event feed (`explore.tsx` category scoring).
- **Analytics** — none currently (no analytics SDK in `mobile/package.json`). If this changes, update both forms.
- **Developer communications** — push notifications and, indirectly, the "Report a Problem" email flow (opens the user's mail client / support inbox — no data leaves the device via the app itself for that flow).
- **Fraud prevention / security** — Sentry crash reports, if enabled.

## 3. Third parties data is shared with

| Party | What they receive | Why |
|---|---|---|
| **Supabase** (backend/DB/auth provider) | All of the above — it *is* the backend | Data processor, not a third-party seller |
| **Expo (push notification relay)** | Push token only | Required to deliver push notifications — Expo does not receive names/emails/etc. |
| **Sentry** (only if `EXPO_PUBLIC_SENTRY_DSN` is set) | Stack traces, device/OS info | Crash diagnostics. `sendDefaultPii: false` and `tracesSampleRate: 0` are set in `src/lib/sentry.ts` specifically so Sentry does **not** receive user identity, session replay, or performance/usage tracking data |

No data is sold. No data is shared for third-party advertising or marketing purposes.

## 4. Data linked to identity vs. not

Everything in the table above is linked to the signed-in account (tied to
the Supabase user id / email), **except**:
- QR-frame camera input (never persisted, so nothing to link).
- Crash diagnostics, if Sentry is enabled — `sendDefaultPii: false` means
  Sentry events are not intentionally tagged with user identity, though
  stack traces could incidentally contain contextual data depending on
  where an error is thrown. Treat as "linked" to be conservative on the
  Apple form unless you configure `beforeSend` scrubbing.

## 5. Encryption & security

- All API traffic is HTTPS (`EXPO_PUBLIC_API_URL` defaults to `https://tikkit.xyz`, Supabase client uses HTTPS).
- Session tokens are stored via `expo-secure-store` (`src/lib/supabase.ts`) — OS-level secure storage (Keychain / Keystore), not plain AsyncStorage.
- `app.json` declares `ITSAppUsesNonExemptEncryption: false` — the app only uses standard OS-provided HTTPS/TLS, no proprietary encryption, so the "does your app use encryption" export-compliance question is answered **No** (skips the manual App Store Connect prompt on every build).

## 6. Data deletion

**In-app path** (Apple Guideline 5.1.1(v) / Play's account-deletion policy):
Profile → Account → **Delete Account**, available to both guest and organizer
accounts as of this pass (`app/(guest)/profile.tsx`, `app/(organizer)/profile.tsx`
→ `deleteAccount()` in `src/lib/api.ts` → `DELETE /api/mobile/profile`).

**⚠️ Verify before submitting the forms**: the backend handler
(`src/app/api/mobile/profile/route.ts`, `DELETE`) currently anonymises
`full_name`, `avatar_url`, and `phone_number`, and blanks out the guest bio/
Instagram/discoverability — but **does not clear the `email` column**, and
registration/check-in history is intentionally retained (anonymised) rather
than hard-deleted, per the in-app copy ("Your event history will be
anonymised"). Both forms ask precisely what "delete" means for your app —
answer **"partial deletion / anonymisation"**, not full erasure, unless the
backend is changed to also clear email and you re-verify. Misstating this
is the single easiest way to fail review or invite a policy strike later,
so don't round up to "full deletion" without checking the current backend
behaviour first.

A web deletion path also exists implicitly via the same account (Supabase
auth), but there's no separate self-serve flow on tikkit.xyz beyond what
the mobile DELETE endpoint already does server-side.

## 7. Children's data

No age gate, no COPPA-directed features. If Tikkit's actual user base
includes under-13 (or under-16 in some jurisdictions) users, this needs a
real compliance review before submission — out of scope for this code
audit.

---

## Quick-fill cheatsheet

**Apple App Privacy** — categories to check "Yes, collected":
Contact Info (Name, Phone Number, Email), Identifiers (User ID), User
Content (Photos, Other User Content), Usage Data (Product Interaction).
All linked to identity except as noted in §4. None used for tracking
(no cross-app/cross-site tracking, no IDFA usage).

**Google Data Safety**:
- Personal info: Name, Email, Phone number → collected, required for
  account functionality, not shared.
- Photos and videos: Photos → collected (payment screenshots), not shared.
- App activity: App interactions → collected, not shared.
- Data is encrypted in transit: **Yes**.
- Users can request data deletion: **Yes** — link to the in-app flow above.
- "Committed to the Play Families Policy": **No** (no children's app).
