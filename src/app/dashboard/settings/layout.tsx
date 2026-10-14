import { PageHeader } from '@/components/kit'
import SettingsNav from '@/components/settings/SettingsNav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="k-fade-up">
      <PageHeader title="Settings" description="Your profile, payments, team and plan." />
      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <SettingsNav />
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  )
}
