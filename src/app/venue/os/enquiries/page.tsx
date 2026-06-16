import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EnquiriesClient from '@/components/venue/os/EnquiriesClient'

export default async function EnquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: venue } = await (supabase as any)
    .from('venues')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!venue) redirect('/venue/onboarding')

  const { data: enquiries } = await (supabase as any)
    .from('venue_enquiries')
    .select(`
      id, guest_name, guest_phone, message, status, reply, replied_at, created_at,
      programme_id, resource_id,
      programme:programmes(title),
      resource:resources(name)
    `)
    .eq('venue_id', venue.id)
    .order('created_at', { ascending: false })

  return <EnquiriesClient initialEnquiries={enquiries ?? []} />
}
