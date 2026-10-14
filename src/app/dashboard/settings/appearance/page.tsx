import { Card, CardBody, CardHeader, ThemeToggle } from '@/components/kit'

export const metadata = { title: 'Appearance' }

export default function AppearanceSettings() {
  return (
    <Card>
      <CardHeader title="Appearance" description="Midnight is the default. Daylight is easier outdoors and on bright screens." />
      <CardBody className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-fg">Theme</p><p className="text-[13px] text-muted">Applies on every device you sign in with.</p></div>
        <ThemeToggle />
      </CardBody>
    </Card>
  )
}
