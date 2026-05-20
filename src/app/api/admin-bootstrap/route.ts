import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const ADMIN_USER_ID = '69656126-ce38-4816-97de-76518e38d270'
const BOOTSTRAP_SECRET = 'tikkit-admin-bootstrap-2026'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const action = request.nextUrl.searchParams.get('action') ?? 'fix'

  try {
    const admin = createAdminClient()

    // Always read current state first
    const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(ADMIN_USER_ID)
    if (authReadError || !authData?.user) {
      return NextResponse.json({ error: 'User not found — service role key may not be set in Vercel env vars', detail: authReadError?.message }, { status: 404 })
    }

    const currentMeta = authData.user.user_metadata ?? {}
    const { data: profile } = await admin.from('profiles').select('role, email').eq('id', ADMIN_USER_ID).single()

    if (action === 'check') {
      // Just return current state without changing anything
      return NextResponse.json({
        action: 'check',
        auth_metadata: currentMeta,
        profile,
        service_role_working: true,
      })
    }

    // action === 'fix' — force set admin role
    const { error: metaError } = await admin.auth.admin.updateUserById(ADMIN_USER_ID, {
      user_metadata: { ...currentMeta, role: 'admin' },
    })

    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', ADMIN_USER_ID)

    // Read back to confirm
    const { data: profileAfter } = await admin.from('profiles').select('role, email').eq('id', ADMIN_USER_ID).single()
    const { data: authAfter } = await admin.auth.admin.getUserById(ADMIN_USER_ID)

    return NextResponse.json({
      action: 'fix',
      before: { auth_metadata: currentMeta, profile },
      after: {
        auth_metadata: authAfter?.user?.user_metadata,
        profile: profileAfter,
      },
      errors: {
        meta: metaError?.message ?? null,
        profile: profileError?.message ?? null,
      },
      success: !metaError && !profileError,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Unexpected error', detail: String(e) }, { status: 500 })
  }
}
