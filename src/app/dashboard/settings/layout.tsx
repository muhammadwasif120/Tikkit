import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/kit'
import SettingsNav from '@/components/settings/SettingsNav'
import { getViewer } from '@/lib/data/viewer'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer()
  const demo = viewer?.user.app_metadata?.demo === true
  return (
    <div className="k-fade-up">
      <PageHeader title="Settings" description="Your profile, payments, team and plan." />
      {demo && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-raised px-4 py-3 text-sm text-muted ring-1 ring-line"><Lock className="h-4 w-4 shrink-0 text-accent" aria-hidden />Settings are view only in the demo workspace.</p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <SettingsNav />
        <div className={demo ? 'pointer-events-none min-w-0 select-none space-y-6 opacity-70' : 'min-w-0 space-y-6'} aria-disabled={demo || undefined}>{children}</div>
      </div>
    </div>
  )
}
