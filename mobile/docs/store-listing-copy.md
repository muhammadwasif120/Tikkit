# Store listing copy — draft

Reference copy for App Store Connect and Google Play Console. Character
limits noted per field — trim to fit before pasting in. Written from what
the app actually does (`mobile/app/`), not aspirational features.

---

## App name

**TIKKIT X**

(App Store Connect "Name" field, 30 char max — fits as-is. `app.json` already
has this as the display name.)

## Subtitle (Apple only, 30 chars)

> Events, tickets, check-ins

## Short description (Play Store, 80 chars)

> Discover events, get your QR ticket, and check in — or run the show.

## Promotional text (Apple only, 170 chars, editable anytime without a review)

> New: faster event check-in, payment screenshot verification, and a
> redesigned guest list for organizers. Update now for the smoothest scan
> experience yet.

*(Swap this out per release — it's meant to be timely, not evergreen.)*

---

## Full description

```
TIKKIT X is how events get discovered, attended, and run — one app for
both sides of the door.

FOR ATTENDEES
• Discover what's happening nearby, filterable by category — music, tech,
  arts, sports, food, business, and more
• Register in a tap for open events, apply for invite-gated ones, or get
  added directly by an organizer
• Your ticket is a QR code, ready the moment you're approved — no printing,
  no screenshots to dig through
• Track every registration's status in one place: pending, approved,
  checked in
• Build a Tikkit reputation — earn social credits and climb tiers
  (Newcomer → Rising → Regular → VIP → Elite) as you attend more events
• Message organizers directly if you have questions before the big day

FOR ORGANIZERS
• Create and publish events with flexible registration: open signup,
  apply-and-approve, or invite-only
• Run the door with a built-in QR scanner — entry and exit scans, VIP
  callouts, live session stats, and a running scan log
• Manage your guest list from anywhere: search, edit, tag VIPs, add
  guests manually, generate QR codes on the spot
• Review and approve registrations, confirm payments from uploaded
  screenshots, and message attendees who need help
• Track vendors and invoices for each event — who's owed what, and when
• See real event analytics: revenue, fill rate, and check-in numbers,
  event by event
• Push notifications the moment a guest signs up, cancels, or checks in

Whether you're building the guest list or getting checked in at the door,
TIKKIT X keeps everyone on the same page.
```

*(~1,650 characters — well under Apple's 4,000 and Play's 4,000 limits, so
there's room to expand with real screenshots/testimonials once available
rather than padding with adjectives.)*

## Keywords (Apple, 100 chars total, comma-separated, no spaces after commas)

```
events,tickets,qr,checkin,rsvp,event app,guest list,organizer,invite,scan,vendor,tickets app
```

*(Trim to fit 100 chars exactly once finalized — count includes commas.)*

## Category

- **Primary**: Events (Apple) / Events (Google Play)
- **Secondary** (Apple only, optional): Business, or Lifestyle — pick
  whichever better matches how the App Store surfaces it in search; Events
  is the load-bearing one either way.

## Age rating

No user-generated content beyond profile bios/instagram handles (both
optional, no public feed of arbitrary UGC), no gambling, no mature content.
Should clear as **4+ / Everyone** on both stores — confirm against the
actual questionnaire since this reflects the code, not a legal review.

## Support & marketing URLs

- Support URL: `https://tikkit.xyz/contact` (or a dedicated support page,
  if one exists — verify before submitting; App Store Connect requires this
  to be a real, working page)
- Marketing URL (optional, Apple): `https://tikkit.xyz`
- Privacy Policy URL (**required**, both stores): `https://tikkit.xyz/privacy`

---

## What's still needed (not in this doc)

- **Screenshots** — 6.7"/6.5"/5.5" iPhone sizes for Apple, phone + optional
  tablet for Play. Needs real device or simulator captures of: Explore,
  Event detail, QR ticket, Organizer dashboard, Scanner. Not generated
  here — this environment can't produce authentic on-device screenshots.
- **Play feature graphic** — 1024×500, promotional banner.
- **App preview video** (optional, both stores).
- Final copy review against whatever the actual current feature set looks
  like at submission time — this app is under active development
  (Sentry, walled-garden registration hardening, etc. per recent commits),
  so a quick diff against this doc before submitting is worth doing.
