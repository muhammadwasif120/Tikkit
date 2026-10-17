// Copy for /how-it-works. Icons live in the client component, text lives here so the page can also use it for structured data.
export type HowStep = { title: string; body: string }

export const ORGANIZER_STEPS: HowStep[] = [
  { title: 'Create your event', body: 'Add the details, cover image and ticket types. Choose open, approval only or invite only, and hide the venue if you like.' },
  { title: 'Share and recruit promoters', body: 'Send your event link on WhatsApp and Instagram. Give each promoter their own link, code and QR so every sale is tracked.' },
  { title: 'Approve guests', body: 'Guests pay you directly and upload a receipt. Check the payment and their guest score, then approve in one tap.' },
  { title: 'Keep everyone in the loop', body: 'Post announcements to every registered guest, and reveal a secret location at the exact time you choose.' },
  { title: 'Run the door', body: 'Send your door team a scanner link. Scan QR tickets, watch the live count and look up anyone by name.' },
]

export const GUEST_STEPS: HowStep[] = [
  { title: 'Find an event', body: 'Browse by city and category, or open a link from an organizer or promoter.' },
  { title: 'Pay the organizer', body: "Send the ticket price by bank transfer, JazzCash or EasyPaisa using the organizer's details." },
  { title: 'Upload your receipt', body: 'Add a screenshot of the transfer. The organizer checks it and approves your ticket.' },
  { title: 'Get your QR ticket', body: 'Your signed QR ticket appears in My tickets. Show it at the door.' },
  { title: 'Build your score', body: 'Every event you attend raises your guest score, which helps you get approved for the best nights.' },
]
