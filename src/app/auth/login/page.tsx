import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Log in or sign up',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <Suspense><LoginClient /></Suspense>
}
