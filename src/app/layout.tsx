import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#1E5EFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://tikkitx.com'),
  title: {
    template: '%s | Tikkit',
    default: 'Tikkit | Host & Discover Exclusive Events in Pakistan',
  },
  description: 'The premier platform to discover, register, and host exclusive events nationwide across Pakistan.',
  applicationName: 'Tikkit',
  openGraph: {
    type: 'website',
    siteName: 'Tikkit',
    title: 'Tikkit | Host & Discover Exclusive Events in Pakistan',
    description: 'The premier platform to discover, register, and host exclusive events nationwide across Pakistan.',
    url: 'https://tikkitx.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit Event Platform Preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tikkit | Host & Discover Exclusive Events',
    description: 'The premier platform to discover, register, and host exclusive events nationwide across Pakistan.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=cabinet-grotesk@400,500,700,800&display=swap"
          rel="stylesheet"
        />

        {/* PWA manifest handled natively by app/manifest.ts */}

        {/* iOS Web App */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Tikkit" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Android / legacy */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1E5EFF" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
