import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSupportConversation } from '@/app/actions/supportActions'
import OrganizerSupportChat from '@/components/dashboard/OrganizerSupportChat'

async function SupportData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const supportMessages = await getSupportConversation()

  return (
    <OrganizerSupportChat
      userId={user.id}
      initialMessages={supportMessages}
    />
  )
}

export default function OrganizerMessagesPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>}>
      <SupportData />
    </Suspense>
  )
}
