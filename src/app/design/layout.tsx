import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Design preview',
  robots: { index: false, follow: false },
}

// Internal design review pages. Hidden in production unless explicitly enabled.
export default function DesignLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DESIGN_PREVIEW !== '1') notFound()
  return <>{children}</>
}
