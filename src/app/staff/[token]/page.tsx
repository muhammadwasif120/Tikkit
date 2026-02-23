import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StaffScanner from '@/components/staff/StaffScanner'
import OrganizerView from '@/components/staff/OrganizerView'

export default async function StaffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .eq('revoked', false)
    .single()

  if (!invite) notFound()

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return (
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="max-w-md w-full text-center py-20">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Link Expired
          </h2>
          <p className="text-gray-400 text-sm">This access link has expired. Ask your organizer for a new one.</p>
        </div>
      </div>
    )
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title, date_start, status')
    .eq('organizer_id', invite.organizer_id)
    .in('status', ['published', 'draft'])
    .order('date_start', { ascending: false })

  if (invite.role === 'organizer') {
    return <OrganizerView invite={invite} events={events ?? []} />
  }

  // Staff: StaffScanner owns its own p-6 wrapper
  return <StaffScanner invite={invite} events={events ?? []} />
}