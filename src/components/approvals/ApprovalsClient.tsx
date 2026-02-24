// PATCH for ApprovalsClient.tsx — replace the existing `approve` function with this one.
// This handles the EOI + paid flow: sends a payment link email instead of a standard approval email.

const approve = async (reg: Registration) => {
  setProcessing(reg.id)
  const event = events.find(e => e.id === reg.event_id)

  const res = await fetch('/api/approve-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId: reg.id }),
  })

  if (!res.ok) {
    console.error('Approval failed:', (await res.json()).error)
    setProcessing(null)
    return
  }

  const result = await res.json()

  if (result.requiresPayment) {
    // EOI + paid: send payment link email instead of standard approval
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'approved_payment_required',
        name: reg.full_name,
        email: reg.email,
        eventTitle: event?.title,
        organizer: (event as any)?.organizer?.company_name ?? (event as any)?.organizer?.full_name,
        paymentToken: result.paymentToken,
        eventId: reg.event_id,
      }),
    })
  } else {
    // Standard approval (free EOI or open events)
    await fetch('/api/send-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'approved',
        name: reg.full_name,
        email: reg.email,
        eventTitle: event?.title,
        organizer: (event as any)?.organizer?.company_name ?? (event as any)?.organizer?.full_name,
        requireIdVerification: event?.require_id_verification,
        requireReferenceCode: event?.require_reference_code,
        referenceCode: event?.reference_code,
      }),
    })
  }

  await dismissInterestNotification(reg.event_id, reg.full_name)
  await notifyGuestApproved(reg.event_id, reg.full_name, event?.title ?? '')
  setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'approved' } : r))
  setProcessing(null)
}