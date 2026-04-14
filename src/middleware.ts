import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Exclude Next.js internals, static files, and PWA assets from middleware
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sitemap.xml|robots.txt|llms.txt|llms-full.txt|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
}