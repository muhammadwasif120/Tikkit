'use client'

import { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, Switch } from '@/components/kit'
import { createClient } from '@/lib/supabase/client'

/** Organizer update emails (announcements, location reveals, retreat updates) can be turned off. Tickets, payments and invites always send. */
export default function EmailPrefs({ initial }: { initial: boolean }) {
  const supabase = useMemo(() => createClient(), [])
  const [on, setOn] = useState(initial)
  const [err, setErr] = useState(false)
  async function flip(v: boolean) {
    setOn(v); setErr(false)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: cur } = await supabase.from('profile_private').select('notification_prefs').eq('id', user!.id).maybeSingle()
    const { error } = await supabase.from('profile_private').update({ notification_prefs: { ...((cur?.notification_prefs as object) ?? {}), email_updates: v } }).eq('id', user!.id)
    if (error) { setOn(!v); setErr(true) }
  }
  return (
    <Card><CardHeader title="Notifications" description="Alerts always show in the app. This controls email." />
      <CardBody>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-medium text-fg">Email me organizer updates</p><p className="text-[13px] text-muted">Announcements, location reveals and retreat updates. Tickets, payments and invites are always emailed.</p></div>
          <Switch checked={on} onChange={flip} label="Email me organizer updates" />
        </div>
        {err && <p role="alert" className="mt-3 text-sm text-danger">We could not save that.</p>}
      </CardBody>
    </Card>
  )
}
