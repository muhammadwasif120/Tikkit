import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCommandCenterData } from '@/app/actions/commandActions'
import CommandCenterClient from '@/components/command/CommandCenterClient'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function CommandEventPage({ params }: Props) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { full_name: string | null; company_name: string | null } | null

  const { event, attendees, recentMessages, error } = await getCommandCenterData(eventId)

  if (error === 'Event not found or access denied' || !event) notFound()

  const organizerName = profile?.company_name ?? profile?.full_name ?? 'Organizer'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CommandCenterClient
        event={event}
        attendees={attendees}
        recentMessages={recentMessages}
        organizerName={organizerName}
      />
    </div>
  )
}
