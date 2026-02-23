import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StaffScanner from '@/components/staff/StaffScanner'

export default async function StaffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Validate invite token
  const { data: invite } = await supabase
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .eq('revoked', false)
    .single()

  if (!invite) notFound()

  // Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-4xl mb-4">⏰</div>
        <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Link Expired
        </h2>
        <p className="text-gray-400 text-sm">This access link has expired. Ask your organizer for a new one.</p>
      </div>
    )
  }

  // Load events for this organizer
  const { data: events } = await supabase
    .from('events')
    .select('id, title, date_start, status')
    .eq('organizer_id', invite.organizer_id)
    .in('status', ['published', 'draft'])
    .order('date_start', { ascending: false })

  return (
    <StaffScanner
      invite={invite}
      events={events ?? []}
    />
  )
}