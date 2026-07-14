import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

// The typed Supabase client returned by createMobileClient (derived so it stays
// in sync with that helper — no manual generic wiring).
type MobileSupabase = NonNullable<Awaited<ReturnType<typeof createMobileClient>>>['supabase']

async function authorize(authHeader: string | null) {
  const auth = await createMobileClient(authHeader)
  if (!auth) return null
  const { supabase, userId } = auth
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) return null
  return { supabase, userId }
}

async function verifyVendorOwnership(supabase: MobileSupabase, vendorId: string, userId: string) {
  const { data } = await supabase
    .from('organiser_vendor_contacts').select('id').eq('id', vendorId).eq('organizer_id', userId).single()
  return !!data
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: vendors } = await supabase
    .from('organiser_vendor_contacts').select('id').eq('organizer_id', userId)
  const vendorIds = (vendors ?? []).map((v: any) => v.id)
  if (vendorIds.length === 0) return Response.json({ invoices: [] })

  const { data: invoices, error } = await supabase
    .from('organiser_vendor_invoices')
    .select('*')
    .in('vendor_id', vendorIds)
    .order('due_date', { ascending: true })

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ invoices: invoices ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { vendor_id, event_id, amount, status, due_date, description } = await req.json()
  if (!vendor_id || !amount) return Response.json({ error: 'vendor_id and amount required' }, { status: 400 })

  if (!await verifyVendorOwnership(supabase, vendor_id, userId))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: invoice, error } = await supabase
    .from('organiser_vendor_invoices')
    .insert({ vendor_id, event_id: event_id || null, amount, status: status ?? 'pending', due_date: due_date || null, description: description || null })
    .select()
    .single()

  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ invoice }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { id, status, amount, due_date, description, paid_at } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { data: inv } = await supabase
    .from('organiser_vendor_invoices').select('id, vendor_id').eq('id', id).single()
  if (!inv || !await verifyVendorOwnership(supabase, inv.vendor_id, userId))
    return Response.json({ error: 'Not found' }, { status: 404 })

  const update: any = {}
  if (status !== undefined) update.status = status
  if (amount !== undefined) update.amount = amount
  if (due_date !== undefined) update.due_date = due_date
  if (description !== undefined) update.description = description
  if (paid_at !== undefined) update.paid_at = paid_at
  if (status === 'paid' && !paid_at) update.paid_at = new Date().toISOString()

  const { data: invoice, error } = await supabase
    .from('organiser_vendor_invoices').update(update).eq('id', id).select().single()
  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ invoice })
}

export async function DELETE(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { data: inv } = await supabase
    .from('organiser_vendor_invoices').select('id, vendor_id').eq('id', id).single()
  if (!inv || !await verifyVendorOwnership(supabase, inv.vendor_id, userId))
    return Response.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('organiser_vendor_invoices').delete().eq('id', id)
  if (error) { console.error(error); return Response.json({ error: "Internal server error" }, { status: 500 }) }
  return Response.json({ ok: true })
}
