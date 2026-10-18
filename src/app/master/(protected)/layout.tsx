import { redirect } from 'next/navigation'
import { Logo } from '@/components/kit'
import MasterNav from '@/components/master/MasterNav'
import { getViewer } from '@/lib/data/viewer'

export const metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  // profiles.role is the only source of truth for admin access (never user metadata).
  if (!viewer || viewer.profile.role !== 'admin') redirect('/master/login')
  const { count: openReports } = await (viewer.supabase as unknown as import('@supabase/supabase-js').SupabaseClient).from('reports').select('id', { count: 'exact', head: true }).in('status', ['open', 'reviewing'])
  return (
    <div className="kit min-h-screen bg-canvas text-fg lg:flex">
      <aside className="border-b border-line bg-surface/60 p-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center gap-2 px-2"><Logo compact /><span className="rounded-md bg-magenta/14 px-1.5 py-0.5 text-[10px] font-semibold text-magenta">ADMIN</span></div>
        <MasterNav reports={openReports ?? 0} />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
  )
}
