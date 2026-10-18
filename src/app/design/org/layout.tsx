import { OrganizerShell } from '@/components/shell/OrganizerShell'

export default function DesignOrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizerShell
      base="/design/org"
      user={{ name: 'Ayesha Khan', company: 'Nightshift Karachi' }}
      plan={{ label: 'Free trial', note: '9 days left', tone: 'accent' }}
      pendingCount={7}
    >
      {children}
    </OrganizerShell>
  )
}
