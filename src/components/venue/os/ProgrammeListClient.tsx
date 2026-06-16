'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Plus, CalendarDays, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { format } from 'date-fns'
import { toggleProgrammeActive } from '@/app/actions/venueActions'

const C = { emerald: '#00D4AA', violet: '#7C3AED', surface: '#0A0F14', border: 'rgba(0,212,170,0.12)', muted: 'rgba(255,255,255,0.4)' }

const CATEGORY_LABELS: Record<string, string> = {
  experience: 'Experience', fitness: 'Fitness', arts: 'Arts & Crafts',
  music: 'Music', food: 'Food & Drink', wellness: 'Wellness',
  business: 'Business', education: 'Education', entertainment: 'Entertainment', other: 'Other',
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
function rruleDays(rrule: string | null): string {
  if (!rrule) return 'Manual'
  const m = rrule.match(/BYDAY=([^;]+)/)
  if (!m) return 'Weekly'
  return m[1].split(',').map(d => {
    const map: Record<string,string> = { MO:'Mon',TU:'Tue',WE:'Wed',TH:'Thu',FR:'Fri',SA:'Sat',SU:'Sun' }
    return map[d] ?? d
  }).join(', ')
}

type Programme = {
  id: string; title: string; category: string; rrule: string | null;
  start_time: string; duration_mins: number; capacity: number; price: number; active: boolean; tags: string[]
  programme_instances?: { id: string; date: string; status: string; tickets_sold: number }[]
}

export default function ProgrammeListClient({ programmes: initial }: { programmes: Programme[] }) {
  const [programmes, setProgrammes] = useState(initial)

  const handleToggle = async (id: string, currentActive: boolean) => {
    setProgrammes(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p))
    await toggleProgrammeActive(id, !currentActive)
  }

  const upcoming = (p: Programme) =>
    (p.programme_instances ?? []).filter(i => i.status === 'scheduled' && i.date >= new Date().toISOString().slice(0,10))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Programmes</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            {programmes.filter(p => p.active).length} active · {programmes.length} total
          </p>
        </div>
        <Link href="/venue/os/programmes/new" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
          <Plus size={15} /> New Programme
        </Link>
      </div>

      {programmes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CalendarDays size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
          <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px' }}>No programmes yet. Create your first recurring experience.</p>
          <Link href="/venue/os/programmes/new" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 12, background: C.emerald, color: '#050508', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
            + Create Programme
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {programmes.map(p => {
            const nextInstances = upcoming(p)
            return (
              <div key={p.id} style={{ background: C.surface, border: `1px solid ${p.active ? C.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '18px 20px', opacity: p.active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Link href={`/venue/os/programmes/${p.id}`} style={{ fontSize: 15, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>{p.title}</Link>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.emerald, background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 20, padding: '1px 7px' }}>
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </span>
                      {!p.active && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '1px 7px' }}>Paused</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{rruleDays(p.rrule)} · {p.start_time.slice(0,5)}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{p.duration_mins}min · Cap {p.capacity}</span>
                      <span style={{ fontSize: 12, color: C.emerald, fontWeight: 700 }}>PKR {p.price.toLocaleString('en-PK')}</span>
                      {nextInstances.length > 0 && (
                        <span style={{ fontSize: 12, color: C.violet }}>
                          Next: {format(new Date(nextInstances[0].date), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {p.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {p.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, color: C.muted, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '2px 8px' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleToggle(p.id, p.active)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: p.active ? C.emerald : C.muted }}>
                      {p.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <Link href={`/venue/os/programmes/${p.id}`} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.emerald, textDecoration: 'none' }}>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
