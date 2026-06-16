import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Subdomains map to their root redirect and protected path prefix
const SUBDOMAIN_MAP: Record<string, { root: string; prefix: string }> = {
  'vendor': { root: '/vendor/os',      prefix: '/vendor'      },
  'venue':  { root: '/venue/os',       prefix: '/venue'       },
  'artist': { root: '/artist-mgmt/os', prefix: '/artist-mgmt' },
}

function getSubdomain(host: string): string | null {
  // "vendor.tikkitx.com" → "vendor", "localhost:3000" → null
  const parts = host.split('.')
  if (parts.length >= 3) return parts[0]
  return null
}

// Share the auth session across all *.tikkitx.com subdomains in production
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.tikkitx.com' : undefined

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host        = request.headers.get('host') ?? ''
  const subdomain   = getSubdomain(host)
  const subConfig   = subdomain ? SUBDOMAIN_MAP[subdomain] : null

  // ── Subdomain root redirect ────────────────────────────────────────────────
  // vendor.tikkitx.com/ → /vendor/os
  // venue.tikkitx.com/  → /venue/os
  if (subConfig && pathname === '/') {
    return NextResponse.redirect(new URL(subConfig.root, request.url))
  }

  let response = NextResponse.next({ request })

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
    '/guest/explore',
    '/register',
    '/organizer',
    '/coming-soon',
    '/demo',
    '/staff',
    '/corporate',
    '/pulse',
    '/privacy',
    '/terms',
    '/compare',
    '/blog',
    '/contact',
    '/pricing',
    '/about',
    '/security',
    '/venues',   // Public venue browse
    '/venue',    // Public venue profile pages
    '/v',        // Public vendor profiles
    '/artists',  // Public artist directory + profiles
  ]

  // On a product subdomain, only its own routes + auth are accessible
  // Everything else redirects to that subdomain's dashboard
  if (subConfig) {
    const isAuth    = pathname.startsWith('/auth')
    const isProduct = pathname.startsWith(subConfig.prefix)
    if (!isAuth && !isProduct) {
      return NextResponse.redirect(new URL(subConfig.root, request.url))
    }
  }

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    if (user && request.method === 'GET') {
      if (pathname === '/auth/login') {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        const metaRole = user.user_metadata?.role as string | undefined
        const role = profile?.role ?? metaRole ?? 'guest'

        // On a product subdomain, authenticated login always goes to that product's root
        if (subConfig) {
          return NextResponse.redirect(new URL(subConfig.root, request.url))
        }

        const dest = role === 'guest'  ? '/explore'
                   : role === 'admin'  ? '/master'
                   : '/dashboard'
        return NextResponse.redirect(new URL(dest, request.url))
      }

      if (pathname === '/master/login') {
        const metaRole = user.user_metadata?.role as string | undefined
        if (metaRole === 'admin') {
          return NextResponse.redirect(new URL('/master', request.url))
        }
        return response
      }
    }

    if (!user && pathname.match(/^\/guest\/explore\/([^/]+)$/)) {
      const slug = pathname.split('/guest/explore/')[1]
      return NextResponse.redirect(new URL(`/register/${slug}`, request.url))
    }

    return response
  }

  // Not logged in → send to login, preserving destination for post-auth redirect
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const metaRole = user.user_metadata?.role as string | undefined

  if (pathname.startsWith('/master')) {
    if (metaRole !== 'admin') {
      return NextResponse.redirect(new URL('/master/login', request.url))
    }
    return response
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? metaRole ?? 'guest'

  if (role === 'guest' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/explore', request.url))
  }

  if (role !== 'guest' && (pathname.startsWith('/guest') || pathname.startsWith('/explore'))) {
    const home = role === 'admin' ? '/master' : '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return response
}
