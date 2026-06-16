'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { CalendarDays, ChevronLeft, Plus } from 'lucide-react'
import { generateInstances, updateInstanceStatus } from '@/app/actions/venueActions'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }
const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: '#00D4AA' },
  live:       { label: 'Live',      color: '#48BB78' },
  cancelled:  { label: 'Cancelled', color: '#FC8181' },
  completed:  { label: 'Completed', color: 'rgba(255,255,255,0.35)' },
}

type Instance = { id: string; date: string; status: string; tickets_sold: number; notes: string | null }
type Programme = {
  id: string; title: string; description: string | null; category: string;
  rrule: string | null; start_time: string; duration_mins: number;
  capacity: number; price: number; currency: string; active: boolean; tags: string[]
  programme_instances: Instance[]
}

function nextOccurrences(rrule: string | null, count = 8): string[] {
  if (!rrule) return []
  const byDay = rrule.match(/BYDAY=([^;]+)/)?.[1]
  if (!byDay) return []
  const dayMap: Record<string, number> = { MO:1, TU:2, WE:3, TH:4, FR:5, SA:6, SU:0 }
  const targetDays = byDay.split(',').map(d => dayMap[d] ?? -1).filter(d => d >= 0)

  const dates: string[] = []
  let d = new Date()
  d.setHours(0,0,0,0)
  while (dates.length < count) {
    if (targetDays.includes(d.getDay())) {
      dates.push(d.toISOString().slice(0,10))
    }
    d = addDays(d, 1)
  }
  return dates
}

export default function ProgrammeDetailClient({ programme }: { programme: Programme }) {
  const [instances, setInstances] = useState(programme.programme_instances)
  const [generating, setGenerating] = useState(false)

  const today = new Date().toISOString().slice(0,10)
  const upcoming = instances.filter(i => i.date >= today)
  const past     = instances.filter(i => i.date < today)

  const handleGenerate = async () => {
    setGenerating(true)
    const dates = nextOccurrences(programme.rrule, 8)
    if (dates.length === 0) { setGenerating(false); return }
    await generateInstances(programme.id, dates)
    // Optimistic: add newly generated dates
    const existingDates = new Set(instances.map(i => i.date))
    const newInstances = dates
      .filter(d => !existingDates.has(d))
      .map(d => ({ id: `temp-${d}`, date: d, status: 'scheduled', tickets_sold: 0, notes: null }))
    setInstances(prev => [...newInstances, ...prev].sort((a,b) => a.date.localeCompare(b.date)))
    setGenerating(false)
  }

  const handleStatusChange = async (instanceId: string, status: string) => {
    setInstances(prev => prev.map(i => i.id === instanceId ? { ...i, status } : i))
    await updateInstanceStatus(instanceId, status)
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Back */}
      <Link href="/venue/os/programmes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 13, textDecoration: 'none', marginBottom: 24 }}>
        <ChevronLeft size={14} /> Programmes
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{programme.title}</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.muted }}>{programme.start_time.slice(0,5)} · {programme.duration_mins}min</span>
            <span style={{ fontSize: 12, color: C.muted }}>Cap {programme.capacity} pax</span>
            <span style={{ fontSize: 12, color: C.emerald, fontWeight: 700 }}>PKR {programme.price.toLocaleString('en-PK')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {programme.rrule && (
            <button onClick={handleGenerate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: C.emerald, fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              <Plus size={14} /> {generating ? 'Generating…' : 'Generate Sessions'}
            </button>
          )}
        </div>
      </div>

      {programme.description && (
        <div style={{ ...card, marginBottom: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{programme.description}</p>
        </div>
      )}

      {/* Upcoming sessions */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Upcoming Sessions</p>
          <span style={{ fontSize: 12, color: C.muted }}>{upcoming.length} scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <CalendarDays size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12 }} />
            <p style={{ color: C.muted, fontSize: 13, margin: '0 0 16px' }}>
              {programme.rrule ? 'No sessions generated yet.' : 'No sessions yet.'}
            </p>
            {programme.rrule && (
              <button onClick={handleGenerate} disabled={generating} style={{ padding: '8px 18px', borderRadius: 10, background: C.emerald, color: '#050508', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {generating ? 'Generating…' : '+ Generate Next 8 Sessions'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(inst => {
              const sc = STATUS_CFG[inst.status] ?? STATUS_CFG.scheduled
              return (
                <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: '#fff' }}>
                      {format(new Date(inst.date), 'EEEE, MMM d')}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                      {programme.start_time.slice(0,5)} · {inst.tickets_sold}/{programme.capacity} booked
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30`, borderRadius: 20, padding: '2px 8px' }}>{sc.label}</span>
                    {inst.status === 'scheduled' && (
                      <select
                        value={inst.status}
                        onChange={e => handleStatusChange(inst.id, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', color: C.muted, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live now</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past sessions */}
      {past.length > 0 && (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px' }}>Past Sessions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {past.slice().reverse().slice(0, 10).map(inst => (
              <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderRadius: 8, opacity: 0.7 }}>
                <span style={{ fontSize: 13, color: '#fff' }}>{format(new Date(inst.date), 'MMM d, yyyy')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{inst.tickets_sold} attended</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_CFG[inst.status]?.color ?? C.muted, background: `${STATUS_CFG[inst.status]?.color ?? C.muted}15`, borderRadius: 20, padding: '1px 7px' }}>{inst.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
