import type { Metadata } from 'next'
import MasterLogin from './MasterLogin'

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false, follow: false } }

export default function MasterLoginPage() {
  return <MasterLogin />
}
