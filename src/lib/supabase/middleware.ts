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
    // Already logged in + hitting login → redirect to their home
    if (user && pathname === '/auth/login') {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const metaRole = user.user_metadata?.role as string | undefined
      const role = profile?.role ?? metaRole ?? 'guest'
      const dest = role === 'guest'  ? '/explore'
                 : role === 'admin'  ? '/master'
                 : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
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

  // Fetch role for route protection
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  // Fall back to auth metadata role so organizers without a profile row
  // don't get silently downgraded to 'guest' and blocked from /dashboard
  const metaRole = user.user_metadata?.role as string | undefined
  const role = profile?.role ?? metaRole ?? 'guest'

  // M7: /master requires admin role — removed from publicPaths above so this
  // check now runs. Non-admins (including organizers) are redirected to login.
  if (pathname.startsWith('/master') && role !== 'admin') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

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