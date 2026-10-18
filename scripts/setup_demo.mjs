// Creates (or refreshes) the demo organizer and sample guests, then builds the demo data.
// Run once after applying supabase/migrations/20261017000001_demo_workspace.sql, and again any time:
//   node --env-file=.env.local scripts/setup_demo.mjs
// Uses the service role key. The demo accounts have random passwords nobody knows: visitors are signed in
// by the server through a one time link, never with a password.

import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

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

for (let i = 0; i < GUESTS.length; i++) {
  const n = String(i + 1).padStart(2, '0')
  await ensure(`demo.guest${n}@demo.tikkitx.com`, { role: 'attendee', full_name: GUESTS[i], city: 'Lahore' }, {})
}
console.log(`${GUESTS.length} sample guests ready`)

const { error: cfg } = await admin.from('demo_config').upsert({ id: true, organizer_id: org.id })
if (cfg) throw cfg
const { error: seed } = await admin.rpc('demo_reseed', { p_force: true })
if (seed) throw seed
console.log('demo data built')
