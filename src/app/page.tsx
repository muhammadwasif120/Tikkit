import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Tikkit — Event Management for Pakistan',
  description: 'Create, manage, and sell tickets for your events. Guest lists, QR check-in, upfront payments — built for Pakistan.',
  openGraph: {
    title: 'Tikkit — Event Management for Pakistan',
    description: 'Create, manage, and sell tickets for your events. Guest lists, QR check-in, upfront payments — built for Pakistan.',
    url: 'https://www.tikkitx.com',
    type: 'website',
  },
  alternates: { canonical: 'https://www.tikkitx.com' },
}

export default function Page() {
  return <HomeClient />
}
