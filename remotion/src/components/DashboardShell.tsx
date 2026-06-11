// Shared design tokens + full-bleed shell for Remotion (1920×1080)
import React from 'react'

// ─── Tokens ───────────────────────────────────────────────────────────────────
export const BG      = '#080A10'
export const SURF    = '#0D0F18'
export const BLUE    = '#1E5EFF'
export const BLUE_D  = '#4D82FF'
export const GREEN   = '#22C55E'
export const YELLOW  = '#FFC745'
export const PURPLE  = '#A78BFA'
export const BORDER  = 'rgba(255,255,255,0.07)'
export const T_SEC   = '#9CA3AF'
export const T_MUT   = '#6B7280'

// ─── Primitives ───────────────────────────────────────────────────────────────
export function Card({
  children, style = {},
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: SURF, border: `1px solid ${BORDER}`,
      borderRadius: 18, ...style,
    }}>
      {children}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const MAP: Record<string, [string, string]> = {
    published: [GREEN,     'rgba(34,197,94,0.1)'    ],
    approved:  [GREEN,     'rgba(34,197,94,0.1)'    ],
    paid:      [GREEN,     'rgba(34,197,94,0.1)'    ],
    pending:   [YELLOW,    'rgba(255,199,69,0.1)'   ],
    draft:     [T_MUT,     'rgba(107,114,128,0.1)'  ],
    waitlist:  [T_MUT,     'rgba(107,114,128,0.1)'  ],
    overdue:   ['#EF4444', 'rgba(239,68,68,0.1)'    ],
  }
  const [c, bg] = MAP[status] ?? MAP.draft
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, color: c, background: bg,
      border: `1px solid ${c}33`, borderRadius: 8,
      padding: '4px 12px', textTransform: 'capitalize' as const,
      whiteSpace: 'nowrap' as const, display: 'inline-block',
    }}>{status}</span>
  )
}

// ─── Full-bleed Shell (sidebar + topbar + scrollable content) ─────────────────
// Use ONLY when the scene needs to show the real dashboard chrome full-screen.
const NAV = [
  { id: 'dash',   label: 'Dashboard', sym: '▦' },
  { id: 'events', label: 'Events',    sym: '◈' },
  { id: 'guests', label: 'Guests',    sym: '⬡' },
  { id: 'appr',   label: 'Approvals', sym: '◉' },
  { id: 'scan',   label: 'Scanner',   sym: '⬚' },
  { id: 'vend',   label: 'Vendors',   sym: '▣' },
  { id: 'anal',   label: 'Analytics', sym: '▥' },
]

function Sidebar({ active }: { active: string }) {
  return (
    <div style={{
      width: 288, flexShrink: 0, height: '100%',
      background: '#090B12', borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{
        height: 76, display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 26px', borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg,#2B6FFF,#1448CC)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 18px rgba(30,94,255,0.4)',
          fontSize: 17, color: '#fff', fontWeight: 900,
        }}>★</div>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Tikkit</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: YELLOW, background: 'rgba(255,199,69,0.1)',
          border: '1px solid rgba(255,199,69,0.2)',
          padding: '2px 8px', borderRadius: 99,
        }}>DEMO</span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: '#2D3748',
          textTransform: 'uppercase' as const, letterSpacing: '0.12em',
          padding: '0 13px', marginBottom: 10,
        }}>Menu</p>
        {NAV.map(n => {
          const on = n.id === active
          return (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 11,
              background:  on ? 'rgba(30,94,255,0.12)' : 'transparent',
              color:        on ? BLUE_D : '#555',
              fontSize:     15, fontWeight: on ? 700 : 500,
              boxShadow:   on ? 'inset 3px 0 0 #1E5EFF' : 'none',
            }}>
              <span style={{ fontSize: 13 }}>{n.sym}</span>
              {n.label}
            </div>
          )
        })}
      </div>

      {/* Profile */}
      <div style={{ padding: '14px 14px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 13,
          background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `${BLUE}20`, border: `1px solid ${BLUE}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: BLUE_D,
          }}>R</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Rooftop Events</p>
            <p style={{ fontSize: 12, color: T_MUT, margin: 0 }}>organizer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopBar({ section }: { section: string }) {
  const TITLES: Record<string, string> = {
    dash: 'Dashboard', events: 'Events', guests: 'Guests',
    appr: 'Approvals', scan: 'Scanner', vend: 'Vendors', anal: 'Analytics',
  }
  return (
    <div style={{
      height: 66, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', borderBottom: `1px solid ${BORDER}`, background: BG,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
          {TITLES[section] ?? 'Dashboard'}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: GREEN,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          padding: '3px 10px', borderRadius: 99,
        }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          background: `${BLUE}18`, border: `1px solid ${BLUE}35`,
          color: BLUE_D, borderRadius: 10, padding: '8px 16px',
          fontSize: 13, fontWeight: 700,
        }}>✦ Tour</div>
        <div style={{
          background: BLUE, color: '#fff', borderRadius: 10,
          padding: '9px 18px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 0 20px rgba(30,94,255,0.3)',
        }}>Get Started →</div>
      </div>
    </div>
  )
}

export function DashShell({
  active, children,
}: { active: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', background: BG, overflow: 'hidden',
    }}>
      <Sidebar active={active} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar section={active} />
        <div style={{
          flex: 1, overflow: 'hidden',
          padding: '36px 44px',
          background: BG,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
