import type { Metadata } from 'next'
import PulsePage from './PulseClient'

export const metadata: Metadata = {
  title: 'Pulse — Host Yoga Retreats, Wellness Events & Workshops in Pakistan',
  description: 'Host yoga retreats, wellness workshops and mindful experiences in Pakistan with Tikkit Pulse. Manage registrations, offline check-in and attendance certificates — built for creators in Murree, Islamabad, Lahore and beyond.',
  keywords: [
    'yoga retreat Pakistan',
    'wellness retreat Pakistan',
    'wellness events Pakistan',
    'retreat planning Pakistan',
    'wellness events Islamabad',
    'yoga events Lahore',
    'retreat organiser Pakistan',
    'workshop registration online Pakistan',
    'mindfulness retreat Pakistan',
    'retreat host tools Pakistan',
    'Murree yoga retreat',
    'sound healing Pakistan',
    'wellness workshop Karachi',
  ],
  openGraph: {
    title: 'Pulse — Wellness Retreats & Mindful Experiences in Pakistan | Tikkit',
    description: 'Host yoga retreats, wellness workshops, and mindful experiences across Pakistan. Offline QR check-in for mountain venues, attendance certificates, and payment collection — all in one place.',
    url: 'https://www.tikkitx.com/pulse',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Pulse — Wellness Events Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Pulse — Wellness Retreats & Workshops in Pakistan | Tikkit',
    description: 'Yoga retreats, wellness workshops, sound healing, mindfulness — built for wellness creators in Murree, Islamabad, Lahore and Karachi.',
  },
  alternates: {
    canonical: 'https://www.tikkitx.com/pulse',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I accept payments for a retreat in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit Pulse accepts JazzCash, EasyPaisa, bank transfer, and credit/debit card — all the payment methods your participants already use. Payments are tracked automatically and payouts are processed to your account on a rolling schedule.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I issue certificates of attendance through Tikkit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Tikkit's verified attendance records (from QR check-in) confirm exactly who attended your retreat or workshop. Export the attended list and generate certificates for confirmed attendees only — making your certificates verifiable and professional.",
      },
    },
    {
      '@type': 'Question',
      name: 'How does offline check-in work at mountain retreat venues?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Tikkit's check-in works without internet. Download your guest list before you leave for the venue. Scan participant QR codes offline — data syncs automatically when you're back in range. Essential for Murree, Hunza, Nathia Gali, and Swat retreats.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best platform for managing yoga retreats in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tikkit Pulse is designed specifically for wellness and retreat creators in Pakistan. It handles registration, local payment methods (JazzCash, EasyPaisa), offline QR check-in for mountain venues, attendance records for certificates, and community management.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I limit capacity for a retreat to keep it intimate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Set a maximum capacity when creating your event on Tikkit. Once the limit is reached, registration closes automatically. You can also enable a waitlist so interested participants are notified if a spot opens up.',
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PulsePage />
    </>
  )
}
