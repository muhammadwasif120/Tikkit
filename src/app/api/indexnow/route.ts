import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/blog'
import { createAdminClient } from '@/lib/supabase/admin'

const INDEX_NOW_KEY = '2aac1ba3120f5fcd7e8ec88cc63f7355'
const BASE_URL = 'https://www.tikkitx.com'
const STATIC_URLS = ['/', '/explore', '/how-it-works', '/pricing', '/classes', '/spaces', '/blog', '/privacy', '/terms'].map(p => `${BASE_URL}${p}`)

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }

/** Public listings only: events, classes, spaces and organizers that are already on the public site. */
async function dynamicUrls(): Promise<string[]> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 180 * 86_400_000).toISOString()
  const [events, classes, spaces, orgs] = await Promise.all([
    admin.from('event_listings').select('slug').gte('ends_at', since).limit(500),
    admin.from('public_class_series').select('slug').limit(300),
    admin.from('public_spaces').select('slug').limit(300),
    admin.from('public_organizers').select('username').not('username', 'is', null).limit(500),
  ])
  return [
    ...(events.data ?? []).filter(e => e.slug).map(e => `${BASE_URL}/events/${e.slug}`),
    ...(classes.data ?? []).filter(c => c.slug).map(c => `${BASE_URL}/classes/${c.slug}`),
    ...(spaces.data ?? []).filter(s => s.slug).map(s => `${BASE_URL}/spaces/${s.slug}`),
    ...(orgs.data ?? []).filter(o => o.username).map(o => `${BASE_URL}/organizer/${o.username}`),
  ]
}

/** POST /api/indexnow with header x-indexnow-secret. Submits the public URLs to IndexNow. */
export async function POST(req: NextRequest) {
  const secret = process.env.INDEXNOW_SECRET
  if (!secret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  if (!same(req.headers.get('x-indexnow-secret') ?? '', secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const urlList = [...STATIC_URLS, ...getAllPosts().map(p => `${BASE_URL}/blog/${p.slug}`), ...(await dynamicUrls())]
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'www.tikkitx.com', key: INDEX_NOW_KEY, keyLocation: `${BASE_URL}/${INDEX_NOW_KEY}.txt`, urlList }),
    })
    return NextResponse.json({ submitted: urlList.length, status: res.status })
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 502 })
  }
}
