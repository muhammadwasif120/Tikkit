import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ForceNoir from '@/components/master/ForceNoir'

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/master/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[master layout] user:', user?.id, '| profile.role:', profile?.role, '| meta.role:', user?.user_metadata?.role)
  if (!profile || profile.role !== 'admin') redirect('/master/login')

  return (
    <>
      <ForceNoir />
      {children}
    </>
  )
}
