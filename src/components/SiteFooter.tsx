import Link from 'next/link'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 32px',
        background: 'var(--guest-bg, #080A10)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        {/* Left: wordmark + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--guest-fg, #F0F2FF)',
              fontFamily: 'var(--font-display, inherit)',
            }}
          >
            Tikkit
          </span>
          <span
            style={{
              fontSize: 13,
              color: 'var(--guest-muted, rgba(240,242,255,0.35))',
              fontFamily: 'var(--font-body, inherit)',
            }}
          >
            Pakistan's event ticketing platform
          </span>
        </div>

        {/* Centre: nav links */}
        <nav
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 28px',
            alignItems: 'center',
          }}
          aria-label="Footer navigation"
        >
          {[
            { href: '/how-it-works', label: 'How it works' },
            { href: '/corporate', label: 'Corporate' },
            { href: '/pulse', label: 'Pulse' },
            { href: '/blog', label: 'Blog' },
            { href: '/privacy', label: 'Privacy policy' },
            { href: '/terms', label: 'Terms of service' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--guest-muted, rgba(240,242,255,0.45))',
                textDecoration: 'none',
                fontFamily: 'var(--font-body, inherit)',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: copyright */}
        <span
          style={{
            fontSize: 12,
            color: 'var(--guest-muted, rgba(240,242,255,0.25))',
            fontFamily: 'var(--font-body, inherit)',
          }}
        >
          © {year} Two Bit Digital Ltd
        </span>
      </div>
    </footer>
  )
}
