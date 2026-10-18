import { OrganizerShell, APP_ROUTES } from '@/components/shell/OrganizerShell'
import { DemoBar } from '@/components/demo/DemoBar'
import { planLabel, requireOrganizer } from '@/lib/data/viewer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, company, logoUrl, entitlements, pendingCount, isManager } = await requireOrganizer()
  return (
    <OrganizerShell
      routes={APP_ROUTES}
      user={{ name: profile.full_name ?? 'Organizer', company: company ?? undefined, avatarUrl: logoUrl ?? profile.avatar_url }}
      plan={isManager ? { label: 'Team member', note: 'Manager', tone: 'accent' } : planLabel(entitlements)}
      manager={isManager}
      pendingCount={pendingCount}
    >
      {user.app_metadata?.demo === true && <DemoBar />}
      {children}
    </OrganizerShell>
  )
}
