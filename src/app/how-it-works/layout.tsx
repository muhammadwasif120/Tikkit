import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works | Secure P2P Ticketing',
  description: 'Learn how Tikkit protects both organizers and guests with our manual screenshot verification and seamless JazzCash, EasyPaisa, or Bank transfers.',
  openGraph: {
    title: 'How It Works | Secure P2P Ticketing',
    description: 'Learn how Tikkit protects both organizers and guests with our manual screenshot verification and seamless JazzCash, EasyPaisa, or Bank transfers.',
  },
  twitter: {
    title: 'How It Works | Secure P2P Ticketing',
    description: 'Learn how Tikkit protects both organizers and guests with our manual screenshot verification and seamless JazzCash, EasyPaisa, or Bank transfers.',
  },
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
