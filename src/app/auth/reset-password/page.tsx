import type { Metadata } from 'next'
import ResetClient from './ResetClient'

export const metadata: Metadata = { title: 'Reset password', robots: { index: false, follow: false } }

export default function ResetPasswordPage() {
  return <ResetClient />
}
