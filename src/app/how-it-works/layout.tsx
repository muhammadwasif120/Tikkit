import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works | Secure P2P Ticketing',
  description: 'Learn how Tikkit protects both organizers and guests with our manual screenshot verification and seamless JazzCash, EasyPaisa, or Bank transfers.',
  alternates: { canonical: 'https://www.tikkitx.com/how-it-works' },
  openGraph: {
    title: 'How It Works | Secure P2P Ticketing',
    description: 'Learn how Tikkit protects both organizers and guests with our manual screenshot verification and seamless JazzCash, EasyPaisa, or Bank transfers.',
    url: 'https://www.tikkitx.com/how-it-works',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'How Tikkit Works — Secure Event Ticketing in Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | Secure P2P Ticketing',
    description: 'Learn how Tikkit protects both organizers and guests with our manual screenshot verification and seamless JazzCash, EasyPaisa, or Bank transfers.',
    images: ['/og-image.jpg'],
  },
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
