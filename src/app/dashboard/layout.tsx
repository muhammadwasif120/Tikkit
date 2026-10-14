import { OrganizerShell, APP_ROUTES } from '@/components/shell/OrganizerShell'
import { planLabel, requireOrganizer } from '@/lib/data/viewer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, company, logoUrl, entitlements, pendingCount } = await requireOrganizer()
  return (
    <OrganizerShell
      routes={APP_ROUTES}
      user={{ name: profile.full_name ?? 'Organizer', company: company ?? undefined, avatarUrl: logoUrl ?? profile.avatar_url }}
      plan={planLabel(entitlements)}
      pendingCount={pendingCount}
    >
      {children}
    </OrganizerShell>
  )
}
