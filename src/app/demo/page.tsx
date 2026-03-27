'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  CalendarDays, MapPin, Users, QrCode, BarChart3,
  CheckCircle2, Clock, XCircle, ArrowRight, Zap,
  CreditCard, Building2, Bell, Shield, ClipboardCheck,
  ChevronRight, ScanLine, TrendingUp, Star, Check,
} from 'lucide-react'

// ─── Mock data ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'create',   label: 'Create Event',      icon: CalendarDays },
  { id: 'share',    label: 'Share & Register',  icon: Users },
  { id: 'guests',   label: 'Manage Guests',     icon: ClipboardCheck },
  { id: 'checkin',  label: 'QR Check-In',       icon: QrCode },
  { id: 'analytics',label: 'Analytics',         icon: BarChart3 },
]

const MOCK_GUESTS = [
  { id: 1, name: 'Ayesha Farooq',   phone: '+92 301 2345678', status: 'approved', paid: true,  time: '2m ago' },
  { id: 2, name: 'Bilal Mahmood',   phone: '+92 333 9876543', status: 'pending',  paid: true,  time: '5m ago' },
  { id: 3, name: 'Sana Hussain',    phone: '+92 312 1122334', status: 'pending',  paid: false, time: '8m ago' },
  { id: 4, name: 'Omar Qureshi',    phone: '+92 321 5566778', status: 'approved', paid: true,  time: '12m ago' },
  { id: 5, name: 'Nadia Khan',      phone: '+92 345 9988776', status: 'waitlist', paid: false, time: '18m ago' },
]

const BAR_DATA = [
  { time: '7pm', pct: 8 },
  { time: '8pm', pct: 32 },
  { time: '9pm', pct: 71 },
  { time: '10pm', pct: 100 },
  { time: '11pm', pct: 88 },
  { time: '12am', pct: 55 },
]

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string; icon: React.FC<{ className?: string }> }> = {
    approved: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 },
    pending:  { color: 'text-[#FFC745]', bg: 'bg-[#FFC74510]', border: 'border-[#FFC74530]',  icon: Clock },
    waitlist: { color: 'text-gray-400',  bg: 'bg-white/5',     border: 'border-white/10',     icon: XCircle },
  }
  const s = map[status] ?? map.waitlist
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.bg} ${s.color} ${s.border}`}>
      <s.icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1E5EFF', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ width: 20, height: 2, background: '#1E5EFF', borderRadius: 1, display: 'inline-block' }} />
      {text}
    </div>
  )
}

// ─── Step panels ─────────────────────────────────────────────────────────────

function StepCreate() {
  const [form, setForm] = useState({ title: 'Rooftop Night — Karachi', venue: 'DHA Phase 5 Rooftop', date: '2026-04-12', capacity: '80', price: '3500', mode: 'paid' })
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-2" style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
      {/* Form side */}
      <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>New Event</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Event Title',  key: 'title',    type: 'text' },
            { label: 'Venue',        key: 'venue',    type: 'text' },
            { label: 'Date',         key: 'date',     type: 'date' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', background: '#161820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 6 }}>Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                style={{ width: '100%', background: '#161820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 6 }}>Ticket Price (PKR)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                style={{ width: '100%', background: '#161820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 8 }}>Registration Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr ', gap: 8 }}>
              {[{ v: 'paid', l: '💳 Paid Entry' }, { v: 'approval', l: '✋ Approval Required' }].map(o => (
                <button key={o.v} onClick={() => setForm(p => ({ ...p, mode: o.v }))}
                  style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: form.mode === o.v ? '1px solid rgba(30,94,255,0.5)' : '1px solid rgba(255,255,255,0.08)', background: form.mode === o.v ? 'rgba(30,94,255,0.12)' : '#161820', color: form.mode === o.v ? '#4D82FF' : '#6B7280', transition: 'all 0.2s' }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <button style={{ background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', boxShadow: '0 0 28px rgba(30,94,255,0.4)', fontFamily: 'var(--font-display)', marginTop: 4 }}>
            <Zap size={15} /> Create Event
          </button>
        </div>
      </div>
      {/* Preview card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>Live Preview</p>
        <div style={{ background: 'linear-gradient(135deg, rgba(30,94,255,0.12) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(30,94,255,0.2)', borderRadius: 20, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px', lineHeight: 1.2 }}>{form.title || 'Your Event Title'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9CA3AF' }}>
              <MapPin size={13} color="#1E5EFF" /> {form.venue || '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9CA3AF' }}>
              <CalendarDays size={13} color="#1E5EFF" /> {form.date || '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9CA3AF' }}>
              <Users size={13} color="#1E5EFF" /> Capacity: {form.capacity} guests
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>Ticket Price</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#FFC745' }}>₨{parseInt(form.price || '0').toLocaleString()}</p>
            </div>
            <div style={{ background: '#1E5EFF', color: '#fff', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>
              Register Now
            </div>
          </div>
        </div>
        <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={18} color="#22C55E" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Your event is ready</p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>A unique shareable link will be generated instantly.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepShare() {
  const [payStep, setPayStep] = useState<'idle' | 'uploaded' | 'approved'>('idle')
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Guest registration view */}
        <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(30,94,255,0.2) 0%, rgba(139,92,246,0.1) 100%)', padding: '28px 28px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Guest Registration</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Rooftop Night — Karachi</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CalendarDays size={12} /> Sat 12 Apr</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={12} /> DHA Phase 5</span>
            </div>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[['Full Name', 'Ayesha Farooq'], ['Phone Number', '+92 301 2345678'], ['Email (optional)', 'ayesha@email.com']].map(([l, v]) => (
                <div key={l}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#6B7280', marginBottom: 5 }}>{l}</label>
                  <div style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#9CA3AF', fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,199,69,0.06)', border: '1px solid rgba(255,199,69,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#FFC745', marginBottom: 8 }}>💳 Payment — ₨3,500</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>Send to JazzCash 0300-1234567 or EasyPaisa, then upload screenshot.</p>
              {payStep === 'idle' && (
                <button onClick={() => setPayStep('uploaded')} style={{ background: '#FFC745', color: '#000', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                  Upload Payment Screenshot
                </button>
              )}
              {payStep === 'uploaded' && (
                <div style={{ background: 'rgba(255,199,69,0.1)', borderRadius: 8, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color="#FFC745" />
                  <span style={{ fontSize: 12, color: '#FFC745', fontWeight: 600 }}>Screenshot uploaded — awaiting verification</span>
                </div>
              )}
              {payStep === 'approved' && (
                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} color="#22C55E" />
                  <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>Payment verified — you&apos;re in! ✓</span>
                </div>
              )}
            </div>
            {payStep !== 'approved' && (
              <button style={{ width: '100%', background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                Submit Registration
              </button>
            )}
          </div>
        </div>
        {/* Organizer approval side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>Organizer View — Payment Approval</p>
          {[
            { name: 'Ayesha Farooq', amount: '₨3,500', method: 'JazzCash', status: payStep },
            { name: 'Bilal Mahmood', amount: '₨3,500', method: 'EasyPaisa', status: 'approved' },
          ].map((row, i) => (
            <div key={i} style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: row.status === 'uploaded' ? 12 : 0 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{row.name}</p>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>{row.method} · {row.amount}</p>
                </div>
                {row.status === 'approved' && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#22C55E' }}>Approved ✓</div>}
                {row.status === 'idle' && <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#4B5563' }}>No upload yet</div>}
              </div>
              {row.status === 'uploaded' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPayStep('approved')} style={{ flex: 1, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
                  <button style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                </div>
              )}
            </div>
          ))}
          <div style={{ background: 'rgba(30,94,255,0.06)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#7BA7FF', marginBottom: 4 }}>📎 Shareable Link</p>
            <p style={{ fontSize: 12, color: '#1E5EFF', fontFamily: 'monospace', background: 'rgba(30,94,255,0.1)', padding: '7px 12px', borderRadius: 8, marginBottom: 10 }}>tikkitx.com/events/rooftop-night-karachi</p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>Share this link on your story, group chat, or anywhere — guests register directly.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepGuests() {
  const [guests, setGuests] = useState(MOCK_GUESTS)
  const { ref, inView } = useInView()
  const approve = (id: number) => setGuests(g => g.map(x => x.id === id ? { ...x, status: 'approved' } : x))
  const deny    = (id: number) => setGuests(g => g.map(x => x.id === id ? { ...x, status: 'waitlist' } : x))
  const approved = guests.filter(g => g.status === 'approved').length
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Approved', val: approved, color: '#22C55E' },
          { label: 'Pending',  val: guests.filter(g => g.status === 'pending').length,  color: '#FFC745' },
          { label: 'Waitlist', val: guests.filter(g => g.status === 'waitlist').length, color: '#6B7280' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>Guest List</p>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{guests.length} registered</span>
        </div>
        <div>
          {guests.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < guests.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${g.id * 50},55%,45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {g.name[0]}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{g.name}</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>{g.phone} · {g.time}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusBadge status={g.status} />
                {g.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => approve(g.id)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></button>
                    <button onClick={() => deny(g.id)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>✕</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepCheckin() {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const { ref, inView } = useInView()
  const doScan = () => {
    setScanState('scanning')
    setTimeout(() => setScanState('success'), 1400)
  }
  const reset = () => setScanState('idle')
  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-2" style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
      {/* Scanner mock */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ width: '100%', maxWidth: 300, aspectRatio: '1', background: '#0D0F18', border: scanState === 'success' ? '2px solid #22C55E' : scanState === 'scanning' ? '2px solid #1E5EFF' : '2px solid rgba(255,255,255,0.07)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, transition: 'border-color 0.4s', position: 'relative', overflow: 'hidden' }}>
          {scanState === 'idle' && <>
            <QrCode size={80} color="rgba(255,255,255,0.12)" />
            <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', padding: '0 24px' }}>Point camera at guest&apos;s QR code</p>
          </>}
          {scanState === 'scanning' && <>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #1E5EFF, transparent)', top: '50%', animation: 'scanLine 0.9s ease-in-out infinite' }} />
            <QrCode size={80} color="#1E5EFF" />
            <p style={{ fontSize: 13, color: '#4D82FF', fontWeight: 600 }}>Scanning…</p>
          </>}
          {scanState === 'success' && <>
            <CheckCircle2 size={60} color="#22C55E" />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E' }}>Checked In! ✓</p>
          </>}
          {scanState === 'error' && <>
            <XCircle size={60} color="#F87171" />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#F87171' }}>Invalid QR Code</p>
          </>}
        </div>
        {scanState === 'idle' && <button onClick={doScan} style={{ background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 32px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)', boxShadow: '0 0 28px rgba(30,94,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}><ScanLine size={16} /> Simulate Scan</button>}
        {scanState !== 'idle' && scanState !== 'scanning' && <button onClick={reset} style={{ background: 'transparent', color: '#6B7280', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Scan Another</button>}
      </div>
      {/* Check-in log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>Check-in Log</p>
        {[
          { name: 'Omar Qureshi',  time: '10:02 PM', status: 'success' },
          { name: 'Ayesha Farooq', time: '10:05 PM', status: scanState === 'success' ? 'success' : 'pending' },
          { name: 'Bilal Mahmood', time: '10:09 PM', status: 'success' },
        ].map((row, i) => (
          <div key={i} style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.4s', borderColor: row.status === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.status === 'success' ? '#22C55E' : '#374151', boxShadow: row.status === 'success' ? '0 0 8px #22C55E' : 'none', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.name}</p>
              <p style={{ fontSize: 11, color: '#6B7280' }}>{row.status === 'pending' ? 'Awaiting scan' : `Checked in · ${row.time}`}</p>
            </div>
            {row.status === 'success' && <QrCode size={16} color="#22C55E" />}
          </div>
        ))}
        <div style={{ background: 'rgba(30,94,255,0.06)', border: '1px solid rgba(30,94,255,0.15)', borderRadius: 14, padding: 16, marginTop: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#7BA7FF', marginBottom: 4 }}>⚡ Staff mode</p>
          <p style={{ fontSize: 12, color: '#6B7280' }}>Share a scanner-only link with your team. They can scan QR codes without accessing your dashboard or guest data.</p>
        </div>
      </div>
    </div>
  )
}

function StepAnalytics() {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue',   val: '₨280,000', sub: '80 tickets @ ₨3,500', color: '#FFC745' },
          { label: 'Attendance Rate', val: '94%',      sub: '75 of 80 scanned in', color: '#22C55E' },
          { label: 'Avg Check-in',    val: '10:08 PM', sub: 'Peak hour 10–11pm',   color: '#4D82FF' },
          { label: 'Waitlisted',      val: '23',       sub: 'Demand for next time', color: '#A855F7' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 22px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4, letterSpacing: '-0.5px' }}>{s.val}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{s.label}</p>
            <p style={{ fontSize: 11, color: '#6B7280' }}>{s.sub}</p>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div style={{ background: '#0D0F18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 24, fontFamily: 'var(--font-display)' }}>Check-in Timeline</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {BAR_DATA.map(b => (
            <div key={b.time} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', background: 'linear-gradient(180deg, #1E5EFF, rgba(30,94,255,0.3))', borderRadius: '6px 6px 0 0', height: inView ? `${b.pct}%` : '0%', transition: 'height 1.2s cubic-bezier(0.34,1.1,0.64,1)', transitionDelay: `${BAR_DATA.indexOf(b) * 0.1}s` }} />
              <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap' }}>{b.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Users,          color: '#1E5EFF', title: 'Guest Lists',       desc: 'RSVPs, manual adds, gender ratios, waitlists — all in one dashboard.' },
  { icon: QrCode,         color: '#A855F7', title: 'QR Check-In',       desc: 'Unique code per guest, scanned at the door. Zero paper lists.' },
  { icon: CreditCard,     color: '#22C55E', title: 'Upfront Payments',  desc: 'JazzCash, EasyPaisa, bank transfer. Screenshot verified in one tap.' },
  { icon: ClipboardCheck, color: '#F59E0B', title: 'Smart Approvals',   desc: 'Run expression-of-interest events. You decide who walks in.' },
  { icon: Building2,      color: '#EC4899', title: 'Vendor Tracking',   desc: 'Every vendor, invoice, and payment tracked in your dashboard.' },
  { icon: Bell,           color: '#06B6D4', title: 'Real-Time Alerts',  desc: 'Notified the moment a guest registers, checks in, or cancels.' },
  { icon: Shield,         color: '#8B5CF6', title: 'Team Access',       desc: 'Scanner-only links for staff — your data stays private.' },
  { icon: TrendingUp,     color: '#F97316', title: 'Event Analytics',   desc: 'Revenue, attendance rates, check-in timelines after every event.' },
]

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Scrollspy
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sectionRefs.current.findIndex(r => r === e.target)
          if (idx >= 0) setActiveStep(idx)
        }
      })
    }, { threshold: 0.4 })
    sectionRefs.current.forEach(r => { if (r) obs.observe(r) })
    return () => obs.disconnect()
  }, [])

  const scrollTo = (i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveStep(i)
  }

  return (
    <>
      <style>{`
        @keyframes scanLine { 0%,100%{top:10%} 50%{top:90%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes orbDrift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(8,10,16,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'all 0.3s' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2B6FFF, #1448CC)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(30,94,255,0.4)' }}>
            <Star size={16} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Tikkit</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, background: 'rgba(255,199,69,0.1)', border: '1px solid rgba(255,199,69,0.25)', color: '#FFC745', padding: '4px 12px', borderRadius: 100, fontWeight: 700, letterSpacing: '0.06em' }}>ORGANIZER DEMO</span>
          <Link href="/register" style={{ background: '#1E5EFF', color: '#fff', textDecoration: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', boxShadow: '0 0 20px rgba(30,94,255,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Get Started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#080A10' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(30,94,255,0.18) 0%, transparent 70%)', pointerEvents: 'none', animation: 'orbDrift 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '25%', right: '5%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(139,92,246,0.09) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 2, animation: 'fadeUp 0.7s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(255,199,69,0.3)', background: 'rgba(255,199,69,0.07)', fontSize: 11, fontWeight: 700, color: '#D4A017', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFC745', boxShadow: '0 0 10px #FFC745', display: 'inline-block', flexShrink: 0 }} />
            Interactive Organizer Demo
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-3px', color: '#F0F2FF', maxWidth: 820, margin: '0 auto 24px' }}>
            Everything you need to{' '}
            <span style={{ background: 'linear-gradient(135deg, #5B8AFF, #1E5EFF, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              run a flawless event
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#6B7280', maxWidth: 540, lineHeight: 1.75, margin: '0 auto 40px' }}>
            See how Tikkit powers every stage — from creating your event to generating post-event reports.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo(0)} style={{ background: '#1E5EFF', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-display)', boxShadow: '0 0 36px rgba(30,94,255,0.45)', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.2s' }}>
              <Zap size={16} /> Start the Tour
            </button>
            <Link href="/register" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: 12, padding: '14px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Get Early Access <ChevronRight size={15} />
            </Link>
          </div>
        </div>
        {/* Mini floating stat cards */}
        <div style={{ display: 'flex', gap: 12, marginTop: 60, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.7s ease 0.3s both' }}>
          {[['84', 'guests registered'], ['₨294K', 'collected'], ['98%', 'check-in rate']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(13,15,24,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 22px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{v}</p>
              <p style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sticky step nav */}
      <div style={{ position: 'sticky', top: 62, zIndex: 80, background: 'rgba(8,10,16,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const active = activeStep === i
            return (
              <button key={s.id} onClick={() => scrollTo(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', background: 'none', border: 'none', borderBottom: active ? '2px solid #1E5EFF' : '2px solid transparent', color: active ? '#fff' : '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all 0.2s', fontFamily: 'var(--font-display)' }}>
                <Icon size={14} color={active ? '#1E5EFF' : '#4B5563'} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#1E5EFF' : '#374151' }}>0{i + 1}</span>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Steps */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        {([
          { id: 'create',    title: 'Create Your Event',          sub: 'Fill in the basics and your event page goes live instantly.', component: <StepCreate /> },
          { id: 'share',     title: 'Share & Collect Payments',   sub: 'One link. Guests register, pay upfront, and you verify with a tap.', component: <StepShare /> },
          { id: 'guests',    title: 'Manage Your Guest List',     sub: 'Approve, deny, or waitlist guests in real time.', component: <StepGuests /> },
          { id: 'checkin',   title: 'QR Check-In at the Door',    sub: 'Every guest has a unique QR code. Your team scans, it\'s done.', component: <StepCheckin /> },
          { id: 'analytics', title: 'Track Performance & Revenue', sub: 'After your event, every number in one clean dashboard.', component: <StepAnalytics /> },
        ] as { id: string; title: string; sub: string; component: React.ReactNode }[]).map((step, i) => (
          <section key={step.id} ref={el => { sectionRefs.current[i] = el as HTMLDivElement | null }} id={step.id} style={{ padding: '80px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', scrollMarginTop: 120 }}>
            <div style={{ marginBottom: 40 }}>
              <SectionLabel text={`Step 0${i + 1}`} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 700, color: '#F0F2FF', letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.1 }}>{step.title}</h2>
              <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, lineHeight: 1.7 }}>{step.sub}</p>
            </div>
            {step.component}
          </section>
        ))}

        {/* Feature grid */}
        <section style={{ padding: '80px 0' }}>
          <SectionLabel text="Everything Included" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 700, color: '#F0F2FF', letterSpacing: '-1.5px', marginBottom: 40, lineHeight: 1.1 }}>All features, no extra charges</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} style={{ background: '#0F1119', padding: '28px 24px', transition: 'background 0.25s', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#131620')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0F1119')}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={18} color={f.color} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '60px 24px 20px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(30,94,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(30,94,255,0.3)', background: 'rgba(30,94,255,0.08)', fontSize: 11, fontWeight: 700, color: '#7BA7FF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
              Ready to host?
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 700, letterSpacing: '-2px', color: '#F0F2FF', marginBottom: 18, lineHeight: 1.0 }}>
              Host your first event<br /><span style={{ color: '#FFC745' }}>on Tikkit.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 400, margin: '0 auto 36px' }}>No credit card required. Set up in minutes.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ background: '#1E5EFF', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '14px 30px', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)', boxShadow: '0 0 36px rgba(30,94,255,0.45)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} /> Get Early Access
              </Link>
              <Link href="/how-it-works" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', borderRadius: 12, padding: '14px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8 }}>
                How It Works <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
