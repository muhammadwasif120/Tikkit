import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { ThemeProvider, type AppTheme } from '@/components/theme/ThemeProvider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics } from '@next/third-parties/google'

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
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tikkitx.com'),
  title: {
    template: '%s | Tikkit',
    default: 'Tikkit — Buy Tickets for Events in Pakistan | Lahore · Karachi · Islamabad',
  },
  description: "Pakistan's #1 event ticketing platform. Buy tickets for concerts, parties, tech conferences & corporate events in Lahore, Karachi & Islamabad. Dynamic QR entry, instant booking.",
  applicationName: 'Tikkit',
  keywords: ['event tickets Pakistan', 'buy tickets Lahore', 'concerts Karachi', 'events Islamabad', 'event management Pakistan', 'ticket booking Pakistan', 'online tickets Pakistan'],
  authors: [{ name: 'Tikkit X', url: 'https://www.tikkitx.com' }],
  creator: 'Tikkit X',
  publisher: 'Tikkit X',
  openGraph: {
    type: 'website',
    siteName: 'Tikkit',
    title: 'Tikkit — Buy Tickets for Events in Pakistan | Lahore · Karachi · Islamabad',
    description: "Pakistan's #1 event ticketing platform. Buy tickets for concerts, parties, tech conferences & corporate events in Lahore, Karachi & Islamabad.",
    url: 'https://www.tikkitx.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit — Event Ticketing Platform Pakistan' }],
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tikkitx',
    creator: '@tikkitx',
    title: 'Tikkit — Buy Tickets for Events in Pakistan',
    description: "Pakistan's #1 event ticketing platform. Concerts, parties, corporate events in Lahore, Karachi & Islamabad.",
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
  verification: {
    other: {
      'msvalidate.01': '2aac1ba3120f5fcd7e8ec88cc63f7355',
    },
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://www.tikkitx.com/feed.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const VALID_THEMES: AppTheme[] = ['noir', 'corporate', 'pulse']

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('tikkit-theme')?.value ?? 'noir'
  const theme: AppTheme = VALID_THEMES.includes(raw as AppTheme) ? (raw as AppTheme) : 'noir'

  return (
    <html lang="en-PK" className={dmSans.variable} data-theme={theme}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.tikkitx.com/#organization",
                  "name": "Tikkit X",
                  "alternateName": ["Tikkit", "TikkitX"],
                  "legalName": "Two Bit Digital Ltd",
                  "url": "https://www.tikkitx.com",
                  "logo": {
                    "@type": "ImageObject",
                    "@id": "https://www.tikkitx.com/#logo",
                    "url": "https://www.tikkitx.com/tikkit-logo.svg",
                    "width": 600,
                    "height": 120,
                    "caption": "Tikkit X"
                  },
                  "image": { "@id": "https://www.tikkitx.com/#logo" },
                  "description": "Pakistan's event ticketing and management platform — guest lists, QR check-in, JazzCash & EasyPaisa payments. Headquartered in Karachi. Built for Pakistani organizers. Free to start.",
                  "foundingDate": "2024",
                  "foundingLocation": { "@type": "Place", "name": "Karachi, Pakistan" },
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Karachi",
                    "addressCountry": "PK"
                  },
                  "founder": {
                    "@type": "Person",
                    "@id": "https://www.tikkitx.com/#founder",
                    "name": "Muhammad Wasif",
                    "jobTitle": "Founder & CEO",
                    "url": "https://www.tikkitx.com/about",
                    "worksFor": { "@id": "https://www.tikkitx.com/#organization" }
                  },
                  "areaServed": [
                    { "@type": "City", "name": "Karachi" },
                    { "@type": "City", "name": "Lahore" },
                    { "@type": "City", "name": "Islamabad" },
                    { "@type": "Country", "name": "Pakistan" }
                  ],
                  "sameAs": [
                    "https://www.instagram.com/tikkitx",
                    "https://www.twitter.com/tikkitx",
                    "https://www.linkedin.com/company/tikkit-x/"
                  ],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer support",
                    "email": "hello@tikkitx.com",
                    "availableLanguage": ["English", "Urdu"]
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.tikkitx.com/#website",
                  "url": "https://www.tikkitx.com",
                  "name": "Tikkit",
                  "publisher": {
                    "@id": "https://www.tikkitx.com/#organization"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.tikkitx.com/explore?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
        {/* Fonts */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
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
      <body className="antialiased">
        <ThemeProvider initialTheme={theme}>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics gaId="G-V4KC6Q8TCQ" />
      </body>
    </html>
  )
}
