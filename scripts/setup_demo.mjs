// Creates (or refreshes) the demo organizer and sample guests, then builds the demo data.
// Run once after applying supabase/migrations/20261017000001_demo_workspace.sql, and again any time:
//   node --env-file=.env.local scripts/setup_demo.mjs
// Uses the service role key. The demo accounts have random passwords nobody knows: visitors are signed in
// by the server through a one time link, never with a password.

import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

export const ORGANIZER_EMAIL = 'demo.organizer@demo.tikkitx.com'
const GUESTS = [
  'Ayesha Khan', 'Bilal Ahmed', 'Hira Malik', 'Usman Sheikh', 'Sana Qureshi', 'Faizan Raza', 'Maham Siddiqui', 'Talha Butt',
  'Noor Chaudhry', 'Daniyal Hussain', 'Rida Javed', 'Hamza Mirza', 'Zoya Naqvi', 'Saad Rehman', 'Iqra Saeed', 'Arslan Khan',
  'Laiba Ahmed', 'Haris Malik', 'Mehak Sheikh', 'Fahad Qureshi', 'Anum Raza', 'Kashif Siddiqui', 'Tooba Butt', 'Waqas Chaudhry',
]

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => u.email?.toLowerCase() === email)
    if (hit) return hit
    if (data.users.length < 200) return null
  }
  return null
}

async function ensure(email, user_metadata, app_metadata) {
  const existing = await findUser(email)
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, { app_metadata, user_metadata, email_confirm: true })
    if (error) throw error
    return data.user
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, email_confirm: true, password: randomBytes(24).toString('hex'), user_metadata, app_metadata,
  })
  if (error) throw error
  return data.user
}

const org = await ensure(ORGANIZER_EMAIL, { role: 'organizer', full_name: 'Areeba Malik', company_name: 'Neon District Events', city: 'Lahore' }, { demo: true })
console.log('organizer', org.id)

// An organizer counts as complete only with a phone, city and company, otherwise the app asks them to finish their profile.
const { error: ph } = await admin.from('profile_private').update({ phone: '03001234567' }).eq('id', org.id)
if (ph) throw ph

const attendee = await ensure('demo.attendee@demo.tikkitx.com',
  { role: 'attendee', full_name: 'Noor Fatima', city: 'Lahore', phone: '03005550123', gender: 'female', date_of_birth: '1996-04-12' }, { demo: true })
console.log('attendee', attendee.id)

for (let i = 0; i < GUESTS.length; i++) {
  const n = String(i + 1).padStart(2, '0')
  await ensure(`demo.guest${n}@demo.tikkitx.com`, { role: 'attendee', full_name: GUESTS[i], city: 'Lahore' }, {})
}
console.log(`${GUESTS.length} sample guests ready`)

// One sample payment receipt, shared by every pending payment in the demo. It lives in the organizer's own folder so
// the demo session can read it, and its path is fixed so nightly rebuilds keep working.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="720" viewBox="0 0 420 720">
  <rect width="420" height="720" fill="#f4f6fb"/><rect x="20" y="20" width="380" height="680" rx="22" fill="#ffffff"/>
  <circle cx="210" cy="108" r="36" fill="#16a34a"/><path d="M193 108l12 12 24-26" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="210" y="190" font-family="Arial, sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#111827">Transfer successful</text>
  <text x="210" y="232" font-family="Arial, sans-serif" font-size="38" font-weight="700" text-anchor="middle" fill="#111827">PKR 2,500</text>
  <line x1="50" y1="276" x2="370" y2="276" stroke="#e5e7eb"/>
  <g font-family="Arial, sans-serif" font-size="16" fill="#6b7280"><text x="50" y="318">To</text><text x="50" y="372">Bank</text><text x="50" y="426">Reference</text><text x="50" y="480">Date</text></g>
  <g font-family="Arial, sans-serif" font-size="17" font-weight="600" text-anchor="end" fill="#111827"><text x="370" y="318">Neon District Events</text><text x="370" y="372">Meezan Bank</text><text x="370" y="426">TXN480001</text><text x="370" y="480">Sample receipt</text></g>
  <text x="210" y="650" font-family="Arial, sans-serif" font-size="13" text-anchor="middle" fill="#9ca3af">Demo data. Not a real payment.</text></svg>`
const png = await sharp(Buffer.from(svg)).png().toBuffer()
const { error: up } = await admin.storage.from('payment-proofs').upload(`${org.id}/demo/receipt.png`, png, { contentType: 'image/png', upsert: true })
if (up) throw up
console.log('sample receipt uploaded')

const { error: cfg } = await admin.from('demo_config').upsert({ id: true, organizer_id: org.id })
if (cfg) throw cfg
const { error: seed } = await admin.rpc('demo_reseed', { p_force: true })
if (seed) throw seed
console.log('demo data built')
