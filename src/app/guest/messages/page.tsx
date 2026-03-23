import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGuestInbox, getGuestChatMessages } from '@/app/actions/commandActions'
import MessagesClient from '@/components/guest/MessagesClient'
import GuestLoader from '@/components/guest/GuestLoader'

async function MessagesData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const threads = await getGuestInbox()

  // Pre-load messages for the first thread
  const initialMessages: Record<string, any[]> = {}
  if (threads[0]) {
    const result = await getGuestChatMessages(threads[0].eventId)
    if (result.messages) {
      initialMessages[threads[0].eventId] = result.messages
    }
  }

  return (
    <MessagesClient
      threads={threads}
      userId={user.id}
      initialMessages={initialMessages}
    />
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<GuestLoader />}>
      <MessagesData />
    </Suspense>
  )
}
