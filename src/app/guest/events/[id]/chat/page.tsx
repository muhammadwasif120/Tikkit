import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGuestChatMessages } from '@/app/actions/commandActions'
import GuestChatPanel from '@/components/guest/GuestChatPanel'
import CyberLoader from '@/components/guest/CyberLoader'

async function ChatData({ eventId }: { eventId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { messages, event, error } = await getGuestChatMessages(eventId)
  if (error || !event) notFound()

  return (
    <GuestChatPanel
      eventId={eventId}
      eventTitle={event.title}
      organizerName={event.organizer_name}
      initialMessages={messages}
      userId={user.id}
    />
  )
}

export default async function GuestChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense fallback={<CyberLoader />}>
      <ChatData eventId={id} />
    </Suspense>
  )
}
