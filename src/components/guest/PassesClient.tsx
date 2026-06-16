'use client'

import { useState, useEffect, useRef } from 'react'
import { Award, Calendar, Star, X, Ticket, Zap, Flame, Gem, Crown, Sparkles } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────── */
type Pass = {
  id: string
  pass_type: string
  issued_at: string
  metadata: Record<string, any> | null
  event: {
    id: string; title: string
    date_start: string; cover_image_url: string | null; tags: string[] | null
  } | null
}

/* ─── Config ─────────────────────────────────────────────────────── */
const PASS_CONFIG: Record<string, { label: string; rarity: string; desc: string }> = {
  attendance:    { label: 'Attendance Pass',    rarity: 'Common',    desc: 'Attended this event' },
  early_bird:    { label: 'Early Bird',         rarity: 'Uncommon',  desc: 'Registered in the first 24 hours' },
  vip:           { label: 'VIP Pass',           rarity: 'Rare',      desc: 'Had VIP access at this event' },
  first_timer:   { label: 'First Timer',        rarity: 'Uncommon',  desc: 'Your very first Tikkit event' },
  streak_3:      { label: '3-Event Streak',     rarity: 'Rare',      desc: '3 events in a row' },
  streak_5:      { label: '5-Event Streak',     rarity: 'Epic',      desc: '5 events in a row' },
  perfect_score: { label: 'Perfect Attendance', rarity: 'Legendary', desc: 'Never missed a registered event' },
}
const RARITY_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; order: number }> = {
  Common:    { color: 'var(--text-secondary)', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', glow: 'rgba(156,163,175,0)',    order: 0 },
  Uncommon:  { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  glow: 'rgba(52,211,153,0.1)',  order: 1 },
  Rare:      { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)', glow: 'rgba(96,165,250,0.15)', order: 2 },
  Epic:      { color: '#A855F7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)', glow: 'rgba(168,85,247,0.2)',  order: 3 },
  Legendary: { color: '#FFC745', bg: 'rgba(255,199,69,0.12)', border: 'rgba(255,199,69,0.3)',  glow: 'rgba(255,199,69,0.25)', order: 4 },
}

/* ─── Pass icon helper ───────────────────────────────────────────── */
function getPassIcon(type: string, size: number, color: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    attendance:    <Ticket size={size} color={color} />,
    early_bird:    <Zap    size={size} color={color} />,
    vip:           <Crown  size={size} color={color} />,
    first_timer:   <Star   size={size} color={color} />,
    streak_3:      <Flame  size={size} color={color} />,
    streak_5:      <Zap    size={size} color={color} />,
    perfect_score: <Gem    size={size} color={color} />,
  }
  return map[type] ?? <Ticket size={size} color={color} />
}

/* ─── Confetti ───────────────────────────────────────────────────── */
function Confetti({ active, rarity }: { active: boolean; rarity: string }) {
  if (!active) return null
  const rarityClr = RARITY_CONFIG[rarity]?.color ?? '#FFC745'
  const colors = [rarityClr, '#1E5EFF', '#FFFFFF', '#FFC745', '#EF4444']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 80 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-10px',
          width: `${5 + Math.random() * 9}px`,
          height: `${5 + Math.random() * 9}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: colors[Math.floor(Math.random() * colors.length)],
          animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
          animationDelay: `${Math.random() * 0.6}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  )
}

const PM_STYLES = `
  @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @media (min-width: 768px) {
    .pm-overlay { align-items: center !important; padding: 20px !important; }
    .pm-panel { border-radius: 28px !important; }
  }
`

/* ─── Pass Modal ─────────────────────────────────────────────────── */
function PassModal({ pass, onClose }: { pass: Pass; onClose: () => void }) {
  const cfg = PASS_CONFIG[pass.pass_type] ?? { label: pass.pass_type, rarity: 'Common', desc: '' }
  const rarity = RARITY_CONFIG[cfg.rarity] ?? RARITY_CONFIG.Common
  const [confetti, setConfetti] = useState(false)
  const [glow, setGlow] = useState(false)

  useEffect(() => {
    setTimeout(() => setGlow(true), 100)
  }, [])

  return (
    <div className="pm-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{PM_STYLES}</style>
      <Confetti active={confetti} rarity={cfg.rarity} />
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} />
      <div className="pm-panel" style={{
        position: 'relative', width: '100%', maxWidth: 480,
        background: 'var(--surface-card-2)', borderRadius: '28px 28px 0 0',
        border: `1px solid ${rarity.border}`,
        boxShadow: glow ? `0 -20px 80px ${rarity.glow}` : 'none',
        animation: 'sheetSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transition: 'box-shadow 0.6s ease',
        padding: '0 0 40px',
        overflow: 'hidden',
      }}>
        {/* Cover or gradient header */}
        <div style={{
          height: 160, position: 'relative',
          background: pass.event?.cover_image_url
            ? `url(${pass.event.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${rarity.bg.replace('0.1', '0.3')}, var(--guest-bg))`,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #13151E 0%, transparent 60%)' }} />
          {/* Rarity shimmer sweep */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 35%, ${rarity.glow} 50%, transparent 65%)`, animation: 'shimmerSwipe 2.5s infinite', overflow: 'hidden' }} />
          {/* Close */}
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}>
            <X size={16} />
          </button>
          {/* Pass icon badge */}
          <div style={{
            position: 'absolute', bottom: -32, left: '50%', transform: 'translateX(-50%)',
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(135deg, ${rarity.bg.replace('0.1','0.4')}, var(--surface-card-2))`,
            border: `2px solid ${rarity.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${rarity.glow}`,
          }}>
            {getPassIcon(pass.pass_type, 30, rarity.color)}
          </div>
        </div>

        <div style={{ padding: '44px 24px 0', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: rarity.bg, border: `1px solid ${rarity.border}`, color: rarity.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 8 }}>
            {cfg.rarity}
          </span>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 900, margin: '0 0 6px', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            {cfg.label}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>{cfg.desc}</p>

          <div style={{ background: 'var(--guest-surface-2)', border: '1px solid var(--guest-border)', borderRadius: 16, padding: '14px 16px', textAlign: 'left', marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Event</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{pass.event?.title ?? 'Unknown Event'}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
              <Calendar size={11} />
              {pass.event?.date_start ? new Date(pass.event.date_start).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 16px' }}>
            Issued {new Date(pass.issued_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <button
            onClick={() => { setConfetti(true); setTimeout(() => setConfetti(false), 3500) }}
            style={{ width: '100%', padding: '13px', border: `1px solid ${rarity.border}`, borderRadius: 14, background: rarity.bg, color: rarity.color, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Sparkles size={14} /> Celebrate this pass
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Pass Card ──────────────────────────────────────────────────── */
function PassCard({ pass, index, onClick, isNew }: { pass: Pass; index: number; onClick: () => void; isNew: boolean }) {
  const cfg = PASS_CONFIG[pass.pass_type] ?? { label: pass.pass_type, rarity: 'Common', desc: '' }
  const rarity = RARITY_CONFIG[cfg.rarity] ?? RARITY_CONFIG.Common
  const [confetti, setConfetti] = useState(false)
  const celebratedRef = useRef(false)

  useEffect(() => {
    if (isNew && !celebratedRef.current) {
      celebratedRef.current = true
      const timer = setTimeout(() => {
        setConfetti(true)
        setTimeout(() => setConfetti(false), 3000)
      }, index * 200)
      return () => clearTimeout(timer)
    }
  }, [isNew, index])

  return (
    <>
      <Confetti active={confetti} rarity={cfg.rarity} />
      <button
        onClick={onClick}
        style={{
          background: 'var(--surface-card-2)', border: `1px solid ${rarity.border}`,
          borderRadius: 18, padding: 0, cursor: 'pointer', textAlign: 'left',
          overflow: 'hidden', width: '100%',
          boxShadow: `0 4px 20px ${rarity.glow}`,
          animation: `revealUp 0.35s ease forwards`,
          animationDelay: `${index * 60}ms`,
          opacity: 0,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${rarity.glow}` }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${rarity.glow}` }}
      >
        {/* Mini cover */}
        <div style={{ height: 70, background: pass.event?.cover_image_url ? `url(${pass.event.cover_image_url}) center/cover` : `linear-gradient(135deg, ${rarity.bg.replace('0.1','0.3')}, var(--guest-bg))`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #13151E 0%, transparent 70%)' }} />
          {isNew && <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 7px', borderRadius: 20, background: '#EF4444', color: '#FFFFFF', fontSize: 9, fontWeight: 700 }}>NEW</div>}
        </div>
        <div style={{ padding: '10px 12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: rarity.bg }}>
              {getPassIcon(pass.pass_type, 14, rarity.color)}
            </div>
            <span style={{ padding: '2px 7px', borderRadius: 20, background: rarity.bg, color: rarity.color, fontSize: 9, fontWeight: 700 }}>{cfg.rarity}</span>
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, margin: '0 0 3px', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>{cfg.label}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pass.event?.title ?? '—'}</p>
        </div>
      </button>
    </>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function PassesClient({ passes, newPassIds = [] }: { passes: Pass[]; newPassIds?: string[] }) {
  const [selected, setSelected] = useState<Pass | null>(null)
  const [sort, setSort] = useState<'recent' | 'rarity'>('recent')

  const sorted = [...passes].sort((a, b) => {
    if (sort === 'rarity') {
      const ra = RARITY_CONFIG[PASS_CONFIG[a.pass_type]?.rarity ?? 'Common']?.order ?? 0
      const rb = RARITY_CONFIG[PASS_CONFIG[b.pass_type]?.rarity ?? 'Common']?.order ?? 0
      return rb - ra
    }
    return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
  })

  const rarityCounts = passes.reduce((acc, p) => {
    const r = PASS_CONFIG[p.pass_type]?.rarity ?? 'Common'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (passes.length === 0) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Award size={48} color="var(--brand-blue)" style={{ opacity: 0.2, marginBottom: 16 }} />
        <h3 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No passes yet</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Attend events to collect digital passes. Each event you attend mints you a unique collectible.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: '16px' }}>
        {/* Header stats */}
        <div style={{ background: 'var(--surface-card-2)', border: '1px solid var(--guest-border)', borderRadius: 18, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>Total Passes</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>{passes.length}</p>
            </div>
            <Award size={32} color="var(--brand-blue)" style={{ opacity: 0.3 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(rarityCounts).map(([rarity, count]) => {
              const rc = RARITY_CONFIG[rarity]
              return (
                <span key={rarity} style={{ padding: '2px 8px', borderRadius: 20, background: rc?.bg, border: `1px solid ${rc?.border}`, color: rc?.color, fontSize: 11, fontWeight: 700 }}>
                  {count} {rarity}
                </span>
              )
            })}
          </div>
        </div>

        {/* Sort toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['recent', 'rarity'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${sort === s ? 'var(--brand-blue)' : 'var(--guest-border)'}`, background: sort === s ? 'rgba(var(--brand-blue-rgb),0.12)' : 'var(--surface-card-2)', color: sort === s ? 'var(--brand-blue)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s', textTransform: 'capitalize' }}
            >
              {s === 'recent' ? 'Most Recent' : 'By Rarity'}
            </button>
          ))}
        </div>

        {/* Responsive grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {sorted.map((pass, i) => (
            <PassCard
              key={pass.id} pass={pass} index={i}
              onClick={() => setSelected(pass)}
              isNew={newPassIds.includes(pass.id)}
            />
          ))}
        </div>
      </div>

      {selected && <PassModal pass={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
