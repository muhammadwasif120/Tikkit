import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes — always allow through
  const publicPaths = [
  '/auth/login',
  '/auth/callback',
  '/auth/reset-password',
  '/master/login',  // Admin login — public, separate from main auth flow
  '/api',
  '/events',
  '/',
  '/how-it-works',
  '/explore',       // Public event showcase (unauthenticated-friendly)
  '/guest/explore',
  '/register',
  '/organizer',     // Public organizer profiles
  '/coming-soon',   // Public marketing waitlist page
  '/demo',          // Interactive organizer demo — no auth required
  '/staff',         // Staff/organizer invite links — token-gated, no auth required
  '/corporate',     // Public marketing landing page
  '/pulse',         // Public marketing landing page
  '/privacy',       // Public privacy policy
  '/terms',         // Public terms & conditions
  '/compare',       // Competitor comparison pages — public SEO landing pages
  '/blog',          // Public blog / SEO content hub
]
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    // Only intercept GET requests — POST requests are Next.js server actions
    // (ensureProfileRole etc.) and must NOT be redirected or they never run
    if (user && request.method === 'GET') {
      // Already-authed user hitting the main login → send to their home
      if (pathname === '/auth/login') {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        const metaRole = user.user_metadata?.role as string | undefined
        const role = profile?.role ?? metaRole ?? 'guest'
        const dest = role === 'guest'  ? '/explore'
                   : role === 'admin'  ? '/master'
                   : '/dashboard'
        return NextResponse.redirect(new URL(dest, request.url))
      }

      // Already-authed admin hitting the admin login → skip straight to /master
      // Use JWT metadata only — no DB read needed here
      if (pathname === '/master/login') {
        const metaRole = user.user_metadata?.role as string | undefined
        if (metaRole === 'admin') {
          return NextResponse.redirect(new URL('/master', request.url))
        }
        // Not admin — show the login form so they can sign in with admin creds
        return response
      }
    }

    // Unauthenticated user hitting /guest/explore/[slug] → send to registration form
    if (!user && pathname.match(/^\/guest\/explore\/([^/]+)$/)) {
      const slug = pathname.split('/guest/explore/')[1]
      return NextResponse.redirect(new URL(`/register/${slug}`, request.url))
    }

    return response
  }

  // Not logged in → send to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // JWT metadata role — signed, no DB round-trip, reliable in edge middleware
  const metaRole = user.user_metadata?.role as string | undefined

  // /master: trust JWT metadata only (DB read in edge middleware is flaky).
  // The layout does an authoritative DB check as a second layer.
  if (pathname.startsWith('/master')) {
    if (metaRole !== 'admin') {
      return NextResponse.redirect(new URL('/master/login', request.url))
    }
    return response
  }

  // For all other protected routes, read profile from DB
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? metaRole ?? 'guest'

  // Guest trying to hit organizer routes
  if (role === 'guest' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  // Non-guest trying to hit guest/explore routes — send to their home
  if (role !== 'guest' && (pathname.startsWith('/guest') || pathname.startsWith('/explore'))) {
    const home = role === 'admin' ? '/master' : '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return response
}