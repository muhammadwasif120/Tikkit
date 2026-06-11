// Shared UI primitives that match the actual Tikkit dashboard exactly
import React from 'react'

export const BG   = '#080A10'
export const SURF = '#0D0F18'
export const BLUE = '#1E5EFF'
export const BLUE_DIM = '#4D82FF'
export const GREEN = '#22C55E'
export const YELLOW = '#FFC745'
export const PURPLE = '#A78BFA'
export const BORDER = 'rgba(255,255,255,0.07)'
export const TEXT_MUT = '#6B7280'
export const TEXT_SEC = '#9CA3AF'

export function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 20, ...style }}>
      {children}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    published: { c: GREEN,   bg: 'rgba(34,197,94,0.1)'   },
    draft:     { c: TEXT_MUT, bg: 'rgba(107,114,128,0.1)' },
    approved:  { c: GREEN,   bg: 'rgba(34,197,94,0.1)'   },
    pending:   { c: YELLOW,  bg: 'rgba(255,199,69,0.1)'  },
    paid:      { c: GREEN,   bg: 'rgba(34,197,94,0.1)'   },
    overdue:   { c: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    waitlist:  { c: TEXT_MUT, bg: 'rgba(107,114,128,0.1)' },
  }
  const s = map[status] ?? map.draft
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, color: s.c, background: s.bg,
      border: `1px solid ${s.c}33`, borderRadius: 8,
      padding: '3px 10px', textTransform: 'capitalize' as const,
      whiteSpace: 'nowrap' as const,
    }}>
      {status}
    </span>
  )
}

// Nav icon shapes (simple geometric stand-ins for lucide)
export const NAV_ITEMS = [
  { id: 'dash',   label: 'Dashboard', icon: '▦' },
  { id: 'events', label: 'Events',    icon: '◈' },
  { id: 'guests', label: 'Guests',    icon: '⬡' },
  { id: 'appr',   label: 'Approvals', icon: '◉' },
  { id: 'scan',   label: 'Scanner',   icon: '⬚' },
  { id: 'vend',   label: 'Vendors',   icon: '▣' },
  { id: 'anal',   label: 'Analytics', icon: '▥' },
]

export function Sidebar({ active = 'dash' }: { active?: string }) {
  return (
    <div style={{
      width: 280, height: '100%', background: '#0A0C14',
      borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 72, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 24px', borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg,#2B6FFF,#1448CC)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(30,94,255,0.4)',
          fontSize: 16, color: '#fff',
        }}>★</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Tikkit</span>
        <span style={{
          fontSize: 10, background: 'rgba(255,199,69,0.12)',
          border: '1px solid rgba(255,199,69,0.25)', color: YELLOW,
          padding: '2px 7px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.06em',
        }}>DEMO</span>
      </div>
      {/* Nav */}
      <div style={{ flex: 1, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.12em', padding: '0 12px', marginBottom: 10 }}>Main Menu</p>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12,
              background: isActive ? 'rgba(30,94,255,0.12)' : 'transparent',
              color: isActive ? BLUE_DIM : '#6B7280',
              fontSize: 15, fontWeight: isActive ? 700 : 500,
              boxShadow: isActive ? 'inset 3px 0 0 #1E5EFF' : 'none',
            }}>
              <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </div>
          )
        })}
      </div>
      {/* Profile */}
      <div style={{ padding: 14, borderTop: `1px solid ${BORDER}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(30,94,255,0.25),rgba(30,94,255,0.1))',
            border: '1px solid rgba(30,94,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: BLUE, flexShrink: 0,
          }}>R</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Rooftop Events</p>
            <p style={{ fontSize: 12, color: TEXT_MUT, margin: 0 }}>organizer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TopBar({ section }: { section: string }) {
  const titles: Record<string, string> = {
    dash: 'Dashboard', events: 'Events', guests: 'Guests',
    appr: 'Approvals', scan: 'Scanner', vend: 'Vendors', anal: 'Analytics',
  }
  return (
    <div style={{
      height: 64, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      borderBottom: `1px solid ${BORDER}`, background: '#080A10', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.4px' }}>
          {titles[section] ?? 'Dashboard'}
        </h1>
        <span style={{
          fontSize: 10, background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)', color: GREEN,
          padding: '3px 9px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.08em',
        }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          background: `${BLUE}15`, border: `1px solid ${BLUE}30`, color: BLUE_DIM,
          borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700,
        }}>
          ✦ Tour
        </div>
        <div style={{
          background: BLUE, color: '#fff', borderRadius: 10,
          padding: '9px 16px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 0 20px rgba(30,94,255,0.3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Get Started →
        </div>
      </div>
    </div>
  )
}

export function DashShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: BG, overflow: 'hidden' }}>
      <Sidebar active={active} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar section={active} />
        <div style={{ flex: 1, overflowY: 'hidden', padding: '32px 36px', background: BG }}>
          {children}
        </div>
      </div>
    </div>
  )
}
