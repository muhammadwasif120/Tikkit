import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Product Demo — See Tikkit in Action',
  description: 'Try an interactive demo of Tikkit\'s organizer dashboard, guest management, dynamic QR scanning, and event analytics. No sign-up required.',
  keywords: ['tikkit demo', 'event management demo Pakistan', 'ticketing platform demo', 'event dashboard demo'],
  alternates: { canonical: 'https://www.tikkitx.com/demo' },
  openGraph: {
    title: 'Tikkit Live Demo — See Pakistan\'s #1 Event Platform in Action',
    description: 'Interactive demo of the Tikkit organizer dashboard. Guest list management, QR scanning, payments, and analytics.',
    url: 'https://www.tikkitx.com/demo',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Dashboard Demo' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    title: 'Tikkit Live Demo — See It in Action',
    description: 'Interactive demo of the Tikkit organizer dashboard. Guest list, QR scanning, analytics.',
    images: ['/og-image.jpg'],
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
