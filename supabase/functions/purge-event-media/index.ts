// Tikkit — Auto-Purge Edge Function
// Runs daily (via Supabase Cron).
// Deletes event_chats and Storage media 72h after event date_end,
// preserving skeleton metadata in event_ledger first.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PURGE_AFTER_HOURS = 72

Deno.serve(async (req) => {
  // Allow manual trigger with auth header, or cron invocation
  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if (authHeader && authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const cutoff = new Date(Date.now() - PURGE_AFTER_HOURS * 60 * 60 * 1000).toISOString()

  // Find completed events whose date_end passed the 72h cutoff
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, organizer_id, title')
    .not('date_end', 'is', null)
    .lt('date_end', cutoff)
    .eq('status', 'completed')

  if (eventsError) {
    console.error('purge: failed to fetch events', eventsError)
    return new Response(JSON.stringify({ error: eventsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ purged: [], message: 'No events due for purge' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results: Array<{
    eventId: string
    title: string
    chatsLedgered: number
    chatsDeleted: number
    filesLedgered: number
    filesDeleted: number
    errors: string[]
  }> = []

  for (const event of events) {
    const eventId: string = event.id
    const errors: string[] = []
    let chatsLedgered = 0, chatsDeleted = 0, filesLedgered = 0, filesDeleted = 0

    // ── Step 1: Ledger + delete event_chats ────────────────────────
    let hasMoreChats = true
    while (hasMoreChats) {
      const { data: chats, error: chatsReadErr } = await supabase
        .from('event_chats')
        .select('id, user_id, message, screenshot_url, created_at')
        .eq('event_id', eventId)
        .limit(1000)

      if (chatsReadErr || !chats) {
        errors.push(`chats read: ${chatsReadErr?.message}`)
        break
      }
      if (chats.length === 0) {
        hasMoreChats = false
        break
      }

      // Write ledger skeleton for each message
      const ledgerRows = chats.map((chat: any) => ({
        event_id: eventId,
        user_id: chat.user_id,
        ref_id: chat.id,
        ledger_type: 'chat_purge_record',
        metadata: {
          message_preview: (chat.message as string).slice(0, 120),
          had_screenshot: !!chat.screenshot_url,
          original_created_at: chat.created_at,
          purged_at: new Date().toISOString(),
        },
      }))

      const { error: ledgerErr } = await supabase.from('event_ledger').insert(ledgerRows)
      if (ledgerErr) {
        errors.push(`chat ledger insert: ${ledgerErr.message}`)
        // If ledger fails, DO NOT DELETE! Break the loop immediately.
        break 
      } else {
        chatsLedgered += ledgerRows.length
      }

      // Delete only the successfully ledgered chats
      const chatIds = chats.map((c: any) => c.id)
      const { error: chatsDelErr } = await supabase
        .from('event_chats')
        .delete()
        .in('id', chatIds)

      if (chatsDelErr) {
        errors.push(`chats delete batch: ${chatsDelErr.message}`)
        break // Stop deleting if a batch delete fails
      } else {
        chatsDeleted += chatIds.length
      }
      
      if (chats.length < 1000) {
        hasMoreChats = false
      }
    }

    // ── Step 2: Ledger + delete Storage media ──────────────────────
    const storagePath = `event-media/${eventId}`
    let hasMoreFiles = true

    while (hasMoreFiles) {
      const { data: files, error: listErr } = await supabase.storage
        .from('tikkit-uploads')
        .list(storagePath, { limit: 100, offset: 0 })

      if (listErr || !files) {
        errors.push(`storage list: ${listErr?.message}`)
        break
      }
      
      const actualFiles = files.filter((f: any) => f.id || f.name.includes('.'))
      if (actualFiles.length === 0) {
        hasMoreFiles = false
        break
      }

      const { error: mediaLedgerErr } = await supabase.from('event_ledger').insert({
        event_id: eventId,
        user_id: event.organizer_id,
        ref_id: `media-purge-${eventId}-${Date.now()}`,
        ledger_type: 'media_purge_record',
        metadata: {
          files_count: actualFiles.length,
          files_deleted: actualFiles.map((f: any) => f.name),
          storage_bucket: 'tikkit-uploads',
          storage_path: storagePath,
          purged_at: new Date().toISOString(),
        },
      })

      if (mediaLedgerErr) {
        errors.push(`media ledger insert: ${mediaLedgerErr.message}`)
        break
      } else {
        filesLedgered += actualFiles.length
      }

      const filePaths = actualFiles.map((f: any) => `${storagePath}/${f.name}`)
      const { error: removeErr } = await supabase.storage
        .from('tikkit-uploads')
        .remove(filePaths)

      if (removeErr) {
        errors.push(`storage remove: ${removeErr.message}`)
        break // Break to avoid infinite loops on offset 0 if delete fails
      } else {
        filesDeleted += actualFiles.length
      }
      
      if (files.length < 100) {
        hasMoreFiles = false
      }
    }

    results.push({
      eventId,
      title: event.title,
      chatsLedgered,
      chatsDeleted,
      filesLedgered,
      filesDeleted,
      errors,
    })

    console.log(`purge: event ${eventId} — chats:${chatsDeleted} files:${filesDeleted} errors:${errors.length}`)
  }

  return new Response(JSON.stringify({ purged: results, ran_at: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
