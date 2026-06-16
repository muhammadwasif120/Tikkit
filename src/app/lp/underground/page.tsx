import type { Metadata } from 'next'
import Link from 'next/link'
import UndergroundHomeClient from './UndergroundHomeClient'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'TIKKIT X — Your night. Your rules.',
  description: 'Run your events end to end — guest lists, QR check-in, JazzCash & EasyPaisa payments. Built for Pakistani organizers.',
  robots: { index: false, follow: false },
}

const CITIES = [
  { slug: 'lahore',     label: 'Lahore'     },
  { slug: 'karachi',    label: 'Karachi'    },
  { slug: 'islamabad',  label: 'Islamabad'  },
  { slug: 'rawalpindi', label: 'Rawalpindi' },
  { slug: 'faisalabad', label: 'Faisalabad' },
  { slug: 'peshawar',   label: 'Peshawar'   },
  { slug: 'multan',     label: 'Multan'     },
  { slug: 'quetta',     label: 'Quetta'     },
]

export default function UndergroundPage() {
  return (
    <>
      <UndergroundHomeClient />
      <section
        aria-label="Browse events by city"
        style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4rem 1.5rem' }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Browse Events by City
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {CITIES.map(c => (
              <Link key={c.slug} href={`/explore/${c.slug}`} style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                Events in {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
