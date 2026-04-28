/**
 * HowTo schema steps for instructional blog articles.
 * Keyed by article slug. When present, the article page injects a
 * HowTo JSON-LD block alongside the standard Article schema — enabling
 * step-by-step rich results in Google Search.
 */

export type HowToStep = {
  name: string
  text: string
}

export const HOWTO_STEPS: Record<string, { name: string; description: string; steps: HowToStep[] }> = {
  'how-to-create-event-tikkit': {
    name: 'How to Create Your First Event on Tikkit',
    description: 'Create and publish an event on Tikkit in under 10 minutes — from account setup to your first registrations.',
    steps: [
      {
        name: 'Create your organiser account',
        text: 'Go to tikkitx.com and click Get Started. Sign up as an Organiser, then complete your profile with a photo and short bio before creating your first event.',
      },
      {
        name: 'Fill in your event details',
        text: 'Click Create Event from your dashboard. Enter the event name, date and time, location, description, and category. Upload a 1600×900 cover image for maximum visibility on the explore page.',
      },
      {
        name: 'Set ticket types and pricing',
        text: 'Add one or more ticket types (Free, Paid, or Multiple Tiers). For paid tickets set the price in PKR, quantity available, and an optional sale end date to create urgency.',
      },
      {
        name: 'Configure your registration mode',
        text: 'Choose Open Registration (anyone can join instantly), Approval Required (you approve each attendee), or Invite Only (private events). Set your maximum capacity.',
      },
      {
        name: 'Preview and publish',
        text: 'Use the preview button to see your event page as an attendee would. When satisfied, click Publish. Your event is now live and appearing on the Tikkit explore page.',
      },
      {
        name: 'Share your event link',
        text: 'Copy your unique event URL from the dashboard. Share it via WhatsApp broadcast, Instagram Stories, and email to drive your first registrations.',
      },
    ],
  },

  'how-to-invite-guests-event': {
    name: 'How to Invite Guests to Your Event on Tikkit',
    description: 'Share your Tikkit event link effectively across WhatsApp, Instagram, and email to maximise registrations.',
    steps: [
      {
        name: 'Copy your event link',
        text: 'After publishing your event, find your unique event link on the dashboard (format: tikkitx.com/events/your-event). This single link handles registration, confirmation, and QR ticket delivery.',
      },
      {
        name: 'Send a WhatsApp broadcast',
        text: 'Create a WhatsApp Broadcast List (not a group). Write a short message: hook, what the event is, date and city, then your link. Broadcast lists feel personal and avoid noise. Send a reminder 48 hours before closing.',
      },
      {
        name: 'Post on Instagram Stories',
        text: 'Upload your event cover image to Instagram Stories. Add a Link sticker pointing to your Tikkit event URL. Also add a Countdown sticker set to your event date — followers who tap Remind Me get notified automatically.',
      },
      {
        name: 'Send email invitations',
        text: 'For professional and corporate events, send a clean email: subject line with event name and date, 2–3 sentences on what it is and who it is for, one clear Register Here button linking to your Tikkit page.',
      },
      {
        name: 'Monitor registrations in real time',
        text: 'Track sign-ups from your Tikkit dashboard. You will see each registrant as they come in. Use the live count in your follow-up messages as social proof to drive more registrations.',
      },
    ],
  },

  'how-to-verify-organiser-profile': {
    name: 'How to Verify Your Organiser Profile on Tikkit',
    description: 'Complete Tikkit\'s organiser verification to unlock paid ticketing, higher search visibility, and attendee trust.',
    steps: [
      {
        name: 'Go to your verification settings',
        text: 'From your dashboard, click your profile photo in the top right corner and select Settings → Verification.',
      },
      {
        name: 'Choose your verification type',
        text: 'Select Individual (CNIC-based, for solo organisers and freelancers) or Business (company registration documents, for agencies and organisations). Read the document requirements before uploading.',
      },
      {
        name: 'Upload your documents',
        text: 'For Individual: upload a clear photo of your CNIC front and back — all text must be readable. For Business: upload your NTN or company registration document and the authorised signatory\'s CNIC.',
      },
      {
        name: 'Complete the liveness check',
        text: 'Take a quick selfie or short video to confirm the CNIC belongs to you. This step prevents identity fraud and is reviewed by the Tikkit team.',
      },
      {
        name: 'Wait for review and confirmation',
        text: 'Tikkit reviews verification requests within 24–48 hours on business days. You will receive an email when approved. Once verified, your profile shows the Verified Organiser badge and you gain access to paid ticketing.',
      },
    ],
  },

  'how-to-share-event-get-registrations': {
    name: 'How to Share Your Event Page and Maximise Registrations',
    description: 'A step-by-step promotion playbook for filling seats at your Tikkit event using WhatsApp, Instagram, and email.',
    steps: [
      {
        name: 'Plan your 72-hour launch window',
        text: 'Most registrations happen in the first 72 hours after launch and the final 48 hours before closing. Plan to announce on every channel simultaneously on launch day to trigger the first spike.',
      },
      {
        name: 'Send your WhatsApp broadcast',
        text: 'Create a broadcast list and send a short message: hook (curiosity or urgency), what the event is, date and city, and your Tikkit link. Keep it under 80 words. Send a follow-up 48 hours before registration closes.',
      },
      {
        name: 'Run your Instagram sequence',
        text: 'Post your event cover as a feed post, add a Stories post with a Link sticker and Countdown timer, and follow up mid-period with social proof (e.g., 40 people registered). Reels showing the venue or past event clips extend organic reach.',
      },
      {
        name: 'Email your existing contacts',
        text: 'Send a clean invitation email to your contact list or past attendees. Subject line: event name and date. Body: 2–3 lines on what it is, one Register Here button. Past attendees convert at a much higher rate than cold audiences.',
      },
      {
        name: 'Run the urgency push in the final 48 hours',
        text: 'Send a final WhatsApp broadcast with a specific capacity signal ("12 seats left" or "Registration closes tonight"). Post a Stories countdown. This second spike typically generates 30–40% of total registrations.',
      },
    ],
  },

  'how-to-check-in-attendees-event': {
    name: 'How to Check In Attendees at Your Event Using Tikkit',
    description: 'Use Tikkit\'s QR check-in system on event day — including offline mode for venues without WiFi.',
    steps: [
      {
        name: 'Install the Tikkit app and log in',
        text: 'Download the Tikkit app on your smartphone or tablet (Android or iOS). Log in with your organiser account. Charge your device fully and bring a portable battery for outdoor or remote venues.',
      },
      {
        name: 'Open the check-in screen before guests arrive',
        text: 'From your dashboard, navigate to your event and tap Check In. Open this screen while you still have internet — at least 30–60 minutes before guests start arriving.',
      },
      {
        name: 'Enable offline mode if needed',
        text: 'If your venue has unreliable WiFi (farmhouses, mountain retreats, outdoor spaces), tap Download Guest List while you have connectivity. Tikkit saves the full list locally so you can scan without internet.',
      },
      {
        name: 'Scan attendee QR codes on arrival',
        text: 'Tap Scan QR and point the camera at each attendee\'s QR code (shown on their phone or printed). The attendee\'s name and ticket type appear in under a second. Tap Check In — the entire process takes 3–5 seconds per person.',
      },
      {
        name: 'Review the attendance report',
        text: 'After the event, open your dashboard to see the full attendance report: total checked in, no-shows, check-in time distribution. Export the list for post-event communications or certificates of attendance.',
      },
    ],
  },

  'how-to-sell-tickets-online-pakistan': {
    name: 'How to Sell Tickets Online in Pakistan',
    description: 'Set up online ticket selling for events in Pakistan with JazzCash, EasyPaisa, and card payment support.',
    steps: [
      {
        name: 'Create your organiser account on Tikkit',
        text: 'Go to tikkitx.com, click Get Started, and sign up as an Organiser. Complete your profile and submit your verification documents to unlock paid ticketing.',
      },
      {
        name: 'Create your event page',
        text: 'Click Create Event and fill in your event name, date, location, description, category, and cover image. A complete event page with a strong description converts significantly better than a sparse one.',
      },
      {
        name: 'Configure ticket types and pricing in PKR',
        text: 'Add your ticket tiers: set the name (General, VIP, Early Bird), price in PKR, quantity available, and optional sale end date. Multiple tiers let you offer early bird pricing and create urgency.',
      },
      {
        name: 'Enable local payment methods',
        text: 'Tikkit automatically enables JazzCash, EasyPaisa, bank transfer (IBFT), and credit/debit card for all verified organiser accounts. No additional setup required — attendees choose their preferred method at checkout.',
      },
      {
        name: 'Publish and share your event link',
        text: 'Publish your event and copy the unique URL from your dashboard. Share it via WhatsApp broadcast, Instagram Stories, and email. The link handles registration, payment collection, confirmation, and QR ticket delivery automatically.',
      },
    ],
  },

  'how-to-plan-corporate-dinner-pakistan': {
    name: 'How to Plan a Corporate Dinner or Gala in Pakistan',
    description: 'A step-by-step guide to planning a corporate dinner or annual gala in Pakistan — from brief to flawless execution.',
    steps: [
      {
        name: 'Set and sign off the brief',
        text: 'Define in writing: the purpose of the event, confirmed headcount, total budget (including 10% contingency), tone and dress code, and who must attend. Get written sign-off before contacting any vendor.',
      },
      {
        name: 'Select and visit the venue',
        text: 'Shortlist venues using the checklist: capacity, parking, in-house catering, AV infrastructure, backup power, and décor flexibility. Visit each venue in person — photos misrepresent dimensions, acoustics, and facilities.',
      },
      {
        name: 'Build your digital guest list on Tikkit',
        text: 'Create a private event on Tikkit with Approval Required registration. This gives you a live, accurate headcount at all times, eliminates duplicate entries, and generates QR codes for seamless check-in.',
      },
      {
        name: 'Send digital invitations',
        text: 'Email your invitation with a Register Here link to your Tikkit event. For executive-level guests, send a personalised email first; follow up with the link 48 hours later. Track who has registered in real time from your dashboard.',
      },
      {
        name: 'Brief your check-in team',
        text: 'Add your event staff to Tikkit with check-in access. Brief them on the QR scanning process and have them download the guest list in offline mode before guests arrive. For 100+ person events, deploy multiple scanning stations.',
      },
      {
        name: 'Run the event and generate your post-event report',
        text: 'Monitor real-time attendance from the dashboard during the event. Afterwards, export the attendance report for your records, thank-you communications, and any compliance or expense reporting requirements.',
      },
    ],
  },
}
