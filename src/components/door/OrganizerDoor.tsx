'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import DoorScanner, { type DoorApi, type ScanResult } from './DoorScanner'

type Raw = { result?: ScanResult['result']; name?: string; ticket?: string; is_vip?: boolean; plus_one?: boolean }
const shape = (r: Raw) => ({ result: r.result ?? 'invalid', name: r.name ?? null, ticket: r.ticket ?? null, is_vip: !!r.is_vip, plus_one: !!r.plus_one })

export default function OrganizerDoor({ eventId, title }: { eventId: string; title: string }) {
  const api = useMemo<DoorApi>(() => {
    const supabase = createClient()
    return {
      async scan(token) {
        const { data, error } = await supabase.rpc('organizer_check_in', { p_event: eventId, p_token: token })
        if (error) throw error
        return shape(data as Raw)
      },
      async admit(id) {
        const { data, error } = await supabase.rpc('organizer_check_in', { p_event: eventId, p_registration: id })
        if (error) throw error
        return shape(data as Raw)
      },
      async lookup(q) {
        const safe = q.replace(/[%,()]/g, ' ')
        const { data } = await supabase.from('registrations')
          .select('id, full_name, status, is_vip, plus_one, ticket_types(name)')
          .eq('event_id', eventId).in('status', ['confirmed', 'checked_in'])
          .or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%`).limit(12)
        return (data ?? []).map(r => ({ id: r.id, name: r.full_name, ticket: r.ticket_types?.name ?? null, status: r.status, isVip: r.is_vip, plusOne: r.plus_one }))
      },
      async counts() {
        const [a, b] = await Promise.all([
          supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).in('status', ['confirmed', 'checked_in']),
          supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'checked_in'),
        ])
        return { expected: a.count ?? 0, admitted: b.count ?? 0 }
      },
    }
  }, [eventId])
  return <DoorScanner api={api} title={title} />
}
