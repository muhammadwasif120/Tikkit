/**
 * IndexNow Submission Script — Tikkit X
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs automatically after every `next build` via the `postbuild` npm hook.
 * Submits all blog article URLs + key static pages to IndexNow, instantly
 * notifying Bing, DuckDuckGo, Yandex, and other participating engines.
 *
 * To add new articles: add their slug to BLOG_SLUGS below.
 * To run manually: node scripts/indexnow-submit.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Only run on production Vercel deploys — skip previews and local builds
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
  console.log(`[IndexNow] Skipping submission on VERCEL_ENV=${process.env.VERCEL_ENV}`)
  process.exit(0)
}

const HOST         = 'www.tikkitx.com'
const KEY          = '2aac1ba3120f5fcd7e8ec88cc63f7355'
const KEY_URL      = `https://${HOST}/${KEY}.txt`
const INDEXNOW_API = 'https://api.indexnow.org/indexnow'

// ── Blog article slugs — add new ones here as articles are published ─────────
const BLOG_SLUGS = [
  // Platform Guides
  'how-to-create-event-tikkit',
  'how-to-sell-tickets-online-pakistan',
  'how-to-invite-guests-event',
  'how-to-verify-organiser-profile',
  'how-to-share-event-get-registrations',
  'how-to-check-in-attendees-event',
  'why-event-verification-matters-pakistan',

  // Corporate Events
  'corporate-event-management-pakistan',
  'how-to-plan-corporate-dinner-pakistan',
  'how-to-run-conference-pakistan',
  'managing-guest-lists-corporate-events-pakistan',
  'how-to-write-post-event-report',

  // Wellness & Retreats
  'wellness-events-pakistan-trends',
  'how-to-plan-yoga-retreat-pakistan',
  'how-to-organise-workshop-masterclass-pakistan',
  'certificates-of-attendance-workshops-pakistan',

  // Pakistan Event Scene
  'planning-events-pakistan-2026',
  'best-events-to-host-lahore-karachi-islamabad',
  'how-to-host-private-party-pakistan',
  'how-to-start-events-business-pakistan',
]

// ── Build the full URL list ──────────────────────────────────────────────────
const urlList = [
  `https://${HOST}/`,
  `https://${HOST}/explore`,
  `https://${HOST}/how-it-works`,
  `https://${HOST}/corporate`,
  `https://${HOST}/pulse`,
  `https://${HOST}/blog`,
  ...BLOG_SLUGS.map(slug => `https://${HOST}/blog/${slug}`),
]

// ── Submit to IndexNow ───────────────────────────────────────────────────────
async function submit() {
  console.log(`\n🔍 IndexNow — submitting ${urlList.length} URLs to ${INDEXNOW_API}`)
  console.log(`   Host:   ${HOST}`)
  console.log(`   Key:    ${KEY}`)
  console.log(`   URLs:   ${urlList.length}\n`)

  const payload = JSON.stringify({
    host:        HOST,
    key:         KEY,
    keyLocation: KEY_URL,
    urlList,
  })

  try {
    // Submit to IndexNow API (notifies all participating engines)
    const res = await fetch(INDEXNOW_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body:    payload,
    })

    if (res.status === 200) {
      console.log('✅ IndexNow: All URLs accepted (200 OK)')
    } else if (res.status === 202) {
      console.log('✅ IndexNow: URLs received, processing async (202 Accepted)')
    } else if (res.status === 422) {
      console.warn('⚠️  IndexNow: One or more URLs malformed (422) — check slugs')
    } else if (res.status === 429) {
      console.warn('⚠️  IndexNow: Rate limited (429) — will retry on next deploy')
    } else {
      console.warn(`⚠️  IndexNow: Unexpected response (${res.status})`)
    }

    // Also submit directly to Bing for fastest indexing
    const bingRes = await fetch('https://www.bing.com/indexnow', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body:    payload,
    })

    if (bingRes.status === 200 || bingRes.status === 202) {
      console.log('✅ Bing IndexNow: Direct submission accepted')
    } else {
      console.warn(`⚠️  Bing IndexNow: Response ${bingRes.status}`)
    }

  } catch (err) {
    // Never fail the build — IndexNow errors are non-critical
    console.warn('⚠️  IndexNow submission failed (non-critical):', err.message)
  }

  console.log('\n📋 URLs submitted:')
  urlList.forEach(url => console.log(`   ${url}`))
  console.log('')
}

submit()
