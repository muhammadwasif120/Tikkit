// Add this to paymentAccountActions.ts — replaces the existing approvePaymentSubmission function

export async function approvePaymentSubmission(submissionId: string, registrationId: string) {
  const supabase = await createClient()

  // 1. Mark submission approved
  const { error: subError } = await supabase
    .from('payment_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) throw subError

  // 2. Update registration payment_status → confirmed, status → approved
  const { error: regError } = await supabase
    .from('public_registrations')
    .update({ payment_status: 'confirmed', status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', registrationId)

  if (regError) throw regError

  // 3. Fetch registration + event details for email + guest creation
  const { data: reg } = await supabase
    .from('public_registrations')
    .select('*, event:events(*, organizer:profiles(full_name, company_name))')
    .eq('id', registrationId)
    .single()

  if (reg) {
    // 4. Create guest record (payment is now confirmed)
    await supabase.from('guests').insert({
      event_id: reg.event_id,
      name: reg.full_name,
      email: reg.email,
      phone: reg.phone,
      status: 'registered',
      source: 'public_registration',
      registration_id: reg.id,
    })

    // 5. Send payment confirmed email
    const event = reg.event as any
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_confirmed',
        name: reg.full_name,
        email: reg.email,
        eventTitle: event?.title,
        organizer: event?.organizer?.company_name ?? event?.organizer?.full_name,
        referenceCode: event?.require_reference_code ? event?.reference_code : null,
      }),
    })
  }
}

export async function rejectPaymentSubmission(submissionId: string, registrationId: string, notes?: string) {
  const supabase = await createClient()

  // 1. Mark submission rejected
  const { error: subError } = await supabase
    .from('payment_submissions')
    .update({ status: 'rejected', notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) throw subError

  // 2. Update registration payment_status → rejected
  const { error: regError } = await supabase
    .from('public_registrations')
    .update({ payment_status: 'rejected' })
    .eq('id', registrationId)

  if (regError) throw regError

  // 3. Send rejection email
  const { data: reg } = await supabase
    .from('public_registrations')
    .select('*, event:events(title)')
    .eq('id', registrationId)
    .single()

  if (reg) {
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment_rejected',
        name: reg.full_name,
        email: reg.email,
        eventTitle: (reg.event as any)?.title,
        notes: notes ?? null,
      }),
    })
  }
}