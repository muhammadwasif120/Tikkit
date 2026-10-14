'use client'

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import DoorScanner, { type DoorApi, type ScanResult } from './DoorScanner'

type Raw = { result?: ScanResult['result']; name?: string; ticket?: string; is_vip?: boolean; plus_one?: boolean }
const shape = (r: Raw) => ({ result: r.result ?? 'invalid', name: r.name ?? null, ticket: r.ticket ?? null, is_vip: !!r.is_vip, plus_one: !!r.plus_one })

/** Door scanner for gate staff. Everything goes through the link token, no account needed. */
export default function GateDoor({ linkToken, eventId }: { linkToken: string; eventId: string }) {
  const api = useMemo<DoorApi>(() => {
    const supabase = createClient()
    return {
      async scan(token) {
        const { data, error } = await supabase.rpc('gate_check_in', { p_link_token: linkToken, p_event: eventId, p_token: token })
        if (error) throw error
        return shape(data as Raw)
      },
      async admit(id) {
        const { data, error } = await supabase.rpc('gate_check_in', { p_link_token: linkToken, p_event: eventId, p_registration: id })
        if (error) throw error
        return shape(data as Raw)
      },
      async lookup(q) {
        const { data, error } = await supabase.rpc('gate_lookup', { p_link_token: linkToken, p_event: eventId, p_query: q })
        if (error) throw error
        return (data ?? []).map(r => ({ id: r.registration_id, name: r.full_name, ticket: r.ticket, status: r.status, isVip: r.is_vip, plusOne: r.plus_one }))
      },
      async counts() {
        const { data, error } = await supabase.rpc('gate_get_events', { p_link_token: linkToken })
        if (error) throw error
        const e = (data ?? []).find(x => x.id === eventId)
        return { expected: e?.expected ?? 0, admitted: e?.admitted ?? 0 }
      },
    }
  }, [linkToken, eventId])
  return <DoorScanner api={api} title="Scanner" />
}
