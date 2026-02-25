import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
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
    '/',
  ]
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    // Already logged in + hitting login → redirect to their home
    if (user && pathname === '/auth/login') {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const role = profile?.role ?? 'guest'
      return NextResponse.redirect(
        new URL(role === 'guest' ? '/explore' : '/dashboard', request.url)
      )
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
  const role = profile?.role ?? 'guest'

  // Guest trying to hit organizer routes
  if (role === 'guest' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  // Organizer trying to hit guest/explore routes
  if (role !== 'guest' && (pathname.startsWith('/guest') || pathname.startsWith('/explore'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}