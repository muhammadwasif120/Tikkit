// Copies legacy storage objects into the new buckets using the service role key from .env.local.
// Usage: node scripts/copy_legacy_storage.mjs <storage_map.json>
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const map = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
let ok = 0
const failed = []
for (const m of map) {
  const { data, error } = await sb.storage.from(m.from_bucket).download(decodeURIComponent(m.from_path))
  if (error || !data) { failed.push({ ...m, error: error?.message }); continue }
  const up = await sb.storage.from(m.to_bucket).upload(m.to_path, data, { upsert: true, contentType: data.type || undefined })
  if (up.error) failed.push({ ...m, error: up.error.message }); else ok++
}
console.log(JSON.stringify({ copied: ok, failed: failed.map(f => ({ from: f.from_bucket + '/' + f.from_path.slice(0, 40), error: f.error })) }, null, 1))
