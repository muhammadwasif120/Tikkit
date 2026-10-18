import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Session cookie is scoped to the apex domain in production. Kept as-is so existing
// sessions (set with this domain) keep working.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.tikkitx.com' : undefined

// Vendor X is built but not open yet: every route within it redirects to the home
// page. Re-launching it is deleting its entry here. (Venues became the Spaces module.)
const GATED_MODULES: { prefixes: string[]; landing: string }[] = [
  { prefixes: ['/vendor'], landing: '/' },
]

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/venues' || pathname.startsWith('/venue/') || pathname === '/venue') {
    return NextResponse.redirect(new URL('/spaces', request.url), 308)
  }

  for (const mod of GATED_MODULES) {
    const inModule = mod.prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (inModule && pathname !== mod.landing) {
      return NextResponse.redirect(new URL(mod.landing, request.url))
    }
  }

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
            // Set domain to apex so session is shared across all *.tikkitx.com subdomains
            response.cookies.set(name, value, { ...options, ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}) })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Mandatory profile completion gate ──────────────────────────────────────
  // Guests and organizers must have phone, ID (CNIC/passport), city, and their
  // role-specific fields (guest: DOB + gender, organizer: company) on file —
  // enforced uniformly regardless of how the account was created (password
  // signup, Google OAuth, or a legacy account from before this gate existed).
  // OAuth signup deliberately stays one-click; this is the walled-garden step
  // that follows it.
  //
  // This runs BEFORE the isPublic early-return below because several genuinely
  // public pages (/explore, /guest/explore, /register) are exactly the pages a
  // logged-in-but-incomplete guest is most likely to land on — if this ran
  // after the isPublic branch it would never fire for them. A short allowlist
  // of pages stays reachable regardless of completeness: auth/API/admin
  // machinery, and static legal/info pages a user might need mid-signup.
  //
  // Cost note: up to two small PK-indexed reads per navigation for
  // authenticated guest/organizer users. Fine at current traffic; if it ever
  // shows up in latency, switch to a single denormalised profiles.profile_complete
  // boolean kept in sync by a trigger.
  const completionExempt = [
    '/auth', '/api', '/master', '/design', '/suspended',
    '/privacy', '/terms', '/security', '/about', '/contact', '/how-it-works',
  ]
  const isCompletionExempt = completionExempt.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (user && !isCompletionExempt) {
    // profiles.is_complete is maintained by the database: attendees need phone, date of
    // birth, city and gender; organizers need company, phone and city.
    const { data: gate } = await supabase
      .from('profiles')
      .select('role, is_complete, suspended_at')
      .eq('id', user.id)
      .maybeSingle()

    // A suspended account can only see the suspended page and sign out.
    if (gate?.suspended_at && !pathname.startsWith('/suspended')) return NextResponse.redirect(new URL('/suspended', request.url))

    if ((gate?.role === 'attendee' || gate?.role === 'organizer') && gate.is_complete === false) {
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }
  }

  // Public routes — always allow through
  const publicPaths = [
    '/auth/login',
    '/auth/callback',
    '/auth/reset-password',
    '/master/login',
    '/api',
    '/events',
    '/',
    '/how-it-works',
    '/explore',
    '/register',
    '/organizer',
    '/demo',
    '/staff',
    '/promoter',
    '/itinerary',
    '/classes',
    '/spaces',
    '/privacy',
    '/terms',
    '/compare',
    '/blog',
    '/contact',
    '/pricing',
    '/about',
    '/security',
    '/suspended',
    '/lp',               // Preserved landing pages (/lp/underground etc.)
    '/design',           // internal design review (404s in production)
  ]

  // Old links to /guest/explore/<id> still redirect to the event page. The For you feed itself needs a login.
  const isLegacyEventLink = /^\/guest\/explore\/[^/]+$/.test(pathname)
  const isPublic = isLegacyEventLink || publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    if (user && request.method === 'GET') {
      if (pathname === '/auth/login') {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        const role = profile?.role ?? 'attendee'

        const dest = role === 'attendee' ? '/guest'
                   : role === 'admin'  ? '/master'
                   : '/dashboard'
        return NextResponse.redirect(new URL(dest, request.url))
      }

      if (pathname === '/master/login') {
        // Authoritative check against profiles.role (not user_metadata, which is
        // user-writable) — also prevents a redirect loop with the /master gate.
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') {
          return NextResponse.redirect(new URL('/master', request.url))
        }
        return response
      }
    }

    return response
  }

  // Not logged in → send to login, preserving destination for post-auth redirect
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authoritative role comes from the trigger-protected profiles.role column.
  // Never gate access on user_metadata.role — it is writable by the user via
  // supabase.auth.updateUser, so using it for authorization would let anyone
  // self-elevate to admin.
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? 'attendee'

  if (pathname.startsWith('/master')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/master/login', request.url))
    }
    return response
  }

  if (role === 'attendee' && pathname.startsWith('/dashboard')) {
    // Team managers are attendee accounts that an organizer invited. They may use the dashboard.
    const { data: team } = await supabase.from('organizer_team_members').select('id')
      .eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle()
    if (!team) return NextResponse.redirect(new URL('/guest', request.url))
    return response
  }

  if (role !== 'attendee' && (pathname.startsWith('/guest') || pathname.startsWith('/explore'))) {
    const home = role === 'admin' ? '/master' : '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return response
}
