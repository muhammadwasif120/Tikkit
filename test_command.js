import { createClient } from '@supabase/supabase-js'

async function run() {
  // Use anon key for test
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // fake login
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // Replace with any valid user or don't
    password: 'password123'
  });

  console.log("Auth:", authErr?.message || authData?.user?.id)

  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('id, title, date_start, date_end, status')
    .in('status', ['published', 'completed'])
    .order('date_start', { ascending: false })
    .limit(20)

  console.log("Events err:", eventsErr)
  console.log("Events len:", events?.length)

  if (!events?.length) return;

  const { data: counts, error: countsErr } = await supabase
    .from('public_registrations')
    .select('event_id')
    .in('event_id', events.map((e) => e.id))
    .neq('status', 'rejected')

  console.log("Counts err:", countsErr)
  console.log("Counts len:", counts?.length)

  const countMap = {}
  for (const row of (counts ?? [])) {
    countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
  }

  const res = events.map((e) => ({ ...e, _count: countMap[e.id] ?? 0 }))
  console.log("Result:", res.length)
}

run().catch(console.error)
