import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// One-time bootstrap route — sets role='admin' on the known admin account.
// Protected by a hardcoded secret passed as ?secret=... in the URL.
// DELETE THIS FILE once the admin account is confirmed working.

const ADMIN_USER_ID = '69656126-ce38-4816-97de-76518e38d270'
const BOOTSTRAP_SECRET = 'tikkit-admin-bootstrap-2026'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const admin = createAdminClient()

    // 1. Read current auth metadata so we don't lose other fields
    const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(ADMIN_USER_ID)
    if (authReadError || !authData?.user) {
      return NextResponse.json({ error: 'User not found', detail: authReadError?.message }, { status: 404 })
    }

    const currentMeta = authData.user.user_metadata ?? {}

    // 2. Set role='admin' in auth metadata
    const { error: metaError } = await admin.auth.admin.updateUserById(ADMIN_USER_ID, {
      user_metadata: { ...currentMeta, role: 'admin' },
    })
    if (metaError) {
      return NextResponse.json({ error: 'Failed to update auth metadata', detail: metaError.message }, { status: 500 })
    }

    // 3. Set role='admin' in profiles (service-role bypasses protect_profile_role trigger)
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', ADMIN_USER_ID)
    if (profileError) {
      return NextResponse.json({ error: 'Failed to update profile', detail: profileError.message }, { status: 500 })
    }

    // 4. Verify it stuck
    const { data: profile } = await admin.from('profiles').select('role, email').eq('id', ADMIN_USER_ID).single()

    return NextResponse.json({
      success: true,
      message: 'Admin account bootstrapped. You can now log in at /master/login.',
      profile,
      auth_metadata_role: 'admin',
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Unexpected error', detail: String(e) }, { status: 500 })
  }
}
