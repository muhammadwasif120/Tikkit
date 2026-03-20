import { getWaitlistCount } from '@/app/actions/waitlistActions'
import { ComingSoonClient } from './ComingSoonClient'

export const metadata = {
  title: 'Coming Soon — Tikkit X',
  description: 'The smartest event management platform in Pakistan is almost here. Join the waitlist for early access.',
}

export default async function ComingSoonPage() {
  const count = await getWaitlistCount()
  return <ComingSoonClient initialCount={count} />
}
