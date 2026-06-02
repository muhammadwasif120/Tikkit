import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  if (!profile || profile.role !== 'admin') {
    // DB role doesn't match — check JWT metadata as authoritative fallback.
    // This fixes the redirect loop caused by a metadata/DB mismatch (e.g. metadata
    // was back-filled to 'admin' but profiles.role was never updated to match).
    const metaRole = user.user_metadata?.role
    if (metaRole === 'admin') {
      // Auto-correct the DB to match the JWT — breaks the loop permanently.
      const adminClient = createAdminClient()
      await adminClient.from('profiles').update({ role: 'admin' } as any).eq('id', user.id)
      // Continue rendering — user is legitimately admin per their signed JWT
    } else {
      redirect('/master/login')
    }
  }

  return (
    <>
      <ForceNoir />
      {children}
    </>
  )
}
