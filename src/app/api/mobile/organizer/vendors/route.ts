import { createMobileClient, mobileUnauthorized } from '@/lib/supabase/mobile'
import { NextRequest } from 'next/server'

async function authorize(authHeader: string | null) {
  const auth = await createMobileClient(authHeader)
  if (!auth) return null
  const { supabase, userId } = auth
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', userId).single()
  if (!profile || !['organizer', 'staff', 'admin'].includes(profile.role)) return null
  return { supabase, userId }
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { data: vendors, error } = await (supabase as any)
    .from('vendors')
    .select('*')
    .eq('organizer_id', userId)
    .order('name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ vendors: vendors ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const body = await req.json()
  const { name, category, contact_name, contact_email, contact_phone, notes } = body
  if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })

  const { data: vendor, error } = await (supabase as any)
    .from('vendors')
    .insert({ organizer_id: userId, name: name.trim(), category: category ?? 'General', contact_name, contact_email, contact_phone, notes })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ vendor }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { id, name, category, contact_name, contact_email, contact_phone, notes } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await (supabase as any)
    .from('vendors').select('id').eq('id', id).eq('organizer_id', userId).single()
  if (!existing) return Response.json({ error: 'Vendor not found' }, { status: 404 })

  const { data: vendor, error } = await (supabase as any)
    .from('vendors')
    .update({ name, category, contact_name, contact_email, contact_phone, notes })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ vendor })
}

export async function DELETE(req: NextRequest) {
  const auth = await authorize(req.headers.get('Authorization'))
  if (!auth) return mobileUnauthorized()
  const { supabase, userId } = auth

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await (supabase as any)
    .from('vendors').select('id').eq('id', id).eq('organizer_id', userId).single()
  if (!existing) return Response.json({ error: 'Vendor not found' }, { status: 404 })

  const { error } = await (supabase as any).from('vendors').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
