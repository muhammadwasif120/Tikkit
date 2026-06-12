import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/blog'
import { createAdminClient } from '@/lib/supabase/admin'

const INDEX_NOW_KEY = '2aac1ba3120f5fcd7e8ec88cc63f7355'
const BASE_URL = 'https://www.tikkitx.com'

// Static URLs to always submit
const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/explore`,
  `${BASE_URL}/how-it-works`,
  `${BASE_URL}/corporate`,
  `${BASE_URL}/pulse`,
  `${BASE_URL}/blog`,
  `${BASE_URL}/privacy`,
  `${BASE_URL}/terms`,
]

/** Pull published event + organizer URLs from DB */
async function getDynamicUrls(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()

    // Upcoming + recent past events (6 months back)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [eventsRes, organizersRes] = await Promise.all([
      admin
        .from('events')
        .select('id, slug')
        .eq('status', 'published')
        .eq('is_private', false)
        .gte('date_start', sixMonthsAgo.toISOString())
        .order('date_start', { ascending: false })
        .limit(500),
      admin
        .from('profiles')
        .select('username')
        .eq('role', 'organizer')
        .not('username', 'is', null)
        .neq('username', '')
        .limit(500),
    ])

    const eventUrls = (eventsRes.data ?? []).map((ev: any) =>
      `${BASE_URL}/guest/explore/${ev.slug || ev.id}`
    )
    const organizerUrls = (organizersRes.data ?? []).map((org: any) =>
      `${BASE_URL}/organizer/${org.username}`
    )

    return [...eventUrls, ...organizerUrls]
  } catch {
    return []
  }
}

/**
 * POST /api/indexnow
 * Submits all blog, event, and organizer URLs to Bing IndexNow for instant crawl.
 * Protect with a secret header: x-indexnow-secret
 *
 * Example: curl -X POST https://www.tikkitx.com/api/indexnow \
 *   -H "x-indexnow-secret: <INDEXNOW_SECRET>"
 *
 * IndexNow propagates to Bing, Yandex, and Seznam simultaneously.
 * Limit: 10,000 URLs per request.
 */
export async function POST(req: NextRequest) {
  // Auth gate — INDEXNOW_SECRET must be set in Vercel env vars
  const secret = process.env.INDEXNOW_SECRET
  if (!secret) {
    console.error('INDEXNOW_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const provided = req.headers.get('x-indexnow-secret')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blogPosts = getAllPosts()
  const blogUrls = blogPosts.map(p => `${BASE_URL}/blog/${p.slug}`)
  const dynamicUrls = await getDynamicUrls()

  const urlList = [...STATIC_URLS, ...blogUrls, ...dynamicUrls]

  const body = {
    host: 'www.tikkitx.com',
    key: INDEX_NOW_KEY,
    keyLocation: `${BASE_URL}/${INDEX_NOW_KEY}.txt`,
    urlList,
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    const statusText = res.ok ? 'OK' : await res.text()

    return NextResponse.json({
      submitted: urlList.length,
      breakdown: {
        static: STATIC_URLS.length,
        blog: blogUrls.length,
        dynamic: dynamicUrls.length,
      },
      bingStatus: res.status,
      bingResponse: statusText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/indexnow
 * Returns the list of URLs that would be submitted — dry run, no Bing call.
 */
export async function GET() {
  const blogPosts = getAllPosts()
  const blogUrls = blogPosts.map(p => `${BASE_URL}/blog/${p.slug}`)
  const dynamicUrls = await getDynamicUrls()
  const urlList = [...STATIC_URLS, ...blogUrls, ...dynamicUrls]

  return NextResponse.json({
    count: urlList.length,
    breakdown: {
      static: STATIC_URLS.length,
      blog: blogUrls.length,
      dynamic: dynamicUrls.length,
    },
    urls: urlList,
  })
}
