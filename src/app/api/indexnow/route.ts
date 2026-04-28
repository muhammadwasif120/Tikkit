import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/blog'

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
]

/**
 * POST /api/indexnow
 * Submits all blog URLs (+ key static pages) to Bing IndexNow for instant crawl.
 * Protect with a secret header in production: x-indexnow-secret
 *
 * Example: curl -X POST https://www.tikkitx.com/api/indexnow \
 *   -H "x-indexnow-secret: <your-deploy-secret>"
 */
export async function POST(req: NextRequest) {
  // Simple auth gate — set INDEXNOW_SECRET env var in Vercel
  const secret = process.env.INDEXNOW_SECRET
  if (secret) {
    const provided = req.headers.get('x-indexnow-secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Build URL list: static pages + all blog articles
  const blogPosts = getAllPosts()
  const blogUrls = blogPosts.map(p => `${BASE_URL}/blog/${p.slug}`)
  const urlList = [...STATIC_URLS, ...blogUrls]

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
      urls: urlList,
      bingStatus: res.status,
      bingResponse: statusText,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/indexnow
 * Returns the list of URLs that would be submitted — useful for verification.
 */
export async function GET() {
  const blogPosts = getAllPosts()
  const blogUrls = blogPosts.map(p => `${BASE_URL}/blog/${p.slug}`)
  const urlList = [...STATIC_URLS, ...blogUrls]

  return NextResponse.json({ count: urlList.length, urls: urlList })
}
