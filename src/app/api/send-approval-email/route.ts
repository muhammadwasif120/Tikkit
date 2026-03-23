import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'Tikkit <noreply@tikkit.app>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tikkit.app'

// ─── Email HTML helpers ──────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0A0C12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0C12;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;background:#1E5EFF;border-radius:8px;display:inline-block;text-align:center;line-height:32px;">
              <span style="color:white;font-size:16px;">T</span>
            </div>
            <span style="color:white;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Tikkit</span>
          </div>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:#13151E;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:40px 36px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;color:#4B5563;font-size:12px;">
          Powered by Tikkit · Made in Pakistan 🇵🇰
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;color:white;font-size:24px;font-weight:800;letter-spacing:-0.5px;">${text}</h1>`
}

function subheading(text: string) {
  return `<p style="margin:0 0 28px;color:#9CA3AF;font-size:15px;line-height:1.6;">${text}</p>`
}

function divider() {
  return `<div style="border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;"></div>`
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:#6B7280;font-size:13px;width:140px;">${label}</td>
    <td style="padding:8px 0;color:#E5E7EB;font-size:13px;font-weight:500;">${value}</td>
  </tr>`
}

function ctaButton(text: string, href: string) {
  return `<div style="text-align:center;margin-top:28px;">
    <a href="${href}" style="display:inline-block;padding:13px 28px;background:#1E5EFF;color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:-0.2px;">${text}</a>
  </div>`
}

function badge(text: string, color: string, bg: string) {
  return `<span style="display:inline-block;padding:4px 12px;background:${bg};border-radius:100px;color:${color};font-size:12px;font-weight:700;">${text}</span>`
}

// ─── Email builders ──────────────────────────────────────────────────────────

function buildApprovedEmail({ name, eventTitle, organizer, requireIdVerification, requireReferenceCode, referenceCode }: any) {
  const content = `
    <div style="margin-bottom:20px;">${badge('✓ You\'re In', '#22C55E', 'rgba(34,197,94,0.15)')}</div>
    ${heading(`Welcome to ${eventTitle}`)}
    ${subheading(`Hey ${name}, your registration has been approved. See you there!`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Event', eventTitle)}
      ${infoRow('Organised by', organizer ?? 'Tikkit')}
      ${requireReferenceCode && referenceCode ? infoRow('Reference Code', `<strong style="color:white;font-size:15px;letter-spacing:0.05em;">${referenceCode}</strong>`) : ''}
    </table>
    ${requireIdVerification ? `${divider()}<p style="color:#FFC745;font-size:13px;margin:0;">⚠️ Please bring a valid CNIC or ID card to the event for verification.</p>` : ''}
    <p style="color:#6B7280;font-size:13px;margin-top:28px;line-height:1.6;">
      Your QR code will be sent closer to the event date. Keep an eye on your inbox.
    </p>
  `
  return baseTemplate(content)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildRejectedEmail({ name, eventTitle, organizer }: any) {
  const content = `
    <div style="margin-bottom:20px;">${badge('Registration Update', '#9CA3AF', 'rgba(156,163,175,0.15)')}</div>
    ${heading(`Update on your registration`)}
    ${subheading(`Hi ${name}, unfortunately we're unable to approve your registration for ${eventTitle} at this time.`)}
    ${divider()}
    <p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0;">
      The organiser has reviewed applications and spots are limited. 
      We appreciate your interest and hope to see you at a future event.
    </p>
  `
  return baseTemplate(content)
}

function buildPaymentRequiredEmail({ name, eventTitle, organizer, paymentToken, eventId }: any) {
  const paymentUrl = `${BASE_URL}/register/${eventId}?step=2&token=${paymentToken}`
  const content = `
    <div style="margin-bottom:20px;">${badge('Action Required', '#FFC745', 'rgba(255,199,69,0.15)')}</div>
    ${heading(`Complete your payment`)}
    ${subheading(`Great news, ${name}! Your spot at ${eventTitle} has been approved. Complete your payment to confirm your place.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Event', eventTitle)}
      ${infoRow('Organised by', organizer ?? 'Tikkit')}
      ${infoRow('Status', 'Pending payment')}
    </table>
    ${ctaButton('Complete Payment →', paymentUrl)}
    <p style="color:#6B7280;font-size:12px;margin-top:16px;text-align:center;line-height:1.6;">
      This link is unique to you. Don't share it.<br/>
      Your spot is reserved for 48 hours.
    </p>
  `
  return baseTemplate(content)
}

function buildPaymentConfirmedEmail({ name, eventTitle, organizer, referenceCode }: any) {
  const content = `
    <div style="margin-bottom:20px;">${badge('✓ Payment Confirmed', '#22C55E', 'rgba(34,197,94,0.15)')}</div>
    ${heading(`You're confirmed for ${eventTitle}`)}
    ${subheading(`Hey ${name}, your payment has been verified. Your spot is locked in!`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Event', eventTitle)}
      ${infoRow('Organised by', organizer ?? 'Tikkit')}
      ${infoRow('Payment', 'Verified ✓')}
      ${referenceCode ? infoRow('Reference Code', `<strong style="color:white;">${referenceCode}</strong>`) : ''}
    </table>
    <p style="color:#6B7280;font-size:13px;margin-top:28px;line-height:1.6;">
      Your QR code will be sent closer to the event. Hang tight!
    </p>
  `
  return baseTemplate(content)
}

function buildPaymentRejectedEmail({ name, eventTitle, notes }: any) {
  const content = `
    <div style="margin-bottom:20px;">${badge('Payment Issue', '#EF4444', 'rgba(239,68,68,0.15)')}</div>
    ${heading(`Payment could not be verified`)}
    ${subheading(`Hi ${name}, unfortunately we couldn't verify your payment for ${eventTitle}.`)}
    ${divider()}
    ${notes ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px 16px;margin-bottom:20px;">
      <p style="color:#FCA5A5;font-size:13px;margin:0;line-height:1.6;"><strong>Organiser note:</strong> ${notes}</p>
    </div>` : ''}
    <p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0;">
      Please contact the event organiser directly to resolve this. 
      You may need to resubmit your payment screenshot.
    </p>
  `
  return baseTemplate(content)
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // SECURITY PATCH: Prevent malicious email hijacking
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, name, email, eventTitle, organizer } = body

    if (!type || !email) {
      return NextResponse.json({ error: 'type and email are required' }, { status: 400 })
    }

    let subject = ''
    let html = ''

    switch (type) {
      case 'approved':
        subject = `You're in — ${eventTitle}`
        html = buildApprovedEmail(body)
        break

      case 'rejected':
        subject = `Update on your registration for ${eventTitle}`
        html = buildRejectedEmail(body)
        break

      case 'approved_payment_required':
        subject = `Action required — complete your payment for ${eventTitle}`
        html = buildPaymentRequiredEmail(body)
        break

      case 'payment_confirmed':
        subject = `Payment confirmed — you're all set for ${eventTitle}!`
        html = buildPaymentConfirmedEmail(body)
        break

      case 'payment_rejected':
        subject = `Payment issue — ${eventTitle}`
        html = buildPaymentRejectedEmail(body)
        break

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    console.error('send-approval-email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}