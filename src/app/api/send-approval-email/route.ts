import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { type, name, email, eventTitle, requireIdVerification, requireReferenceCode, referenceCode } = await req.json()

  const firstName = name.split(' ')[0]

  let subject = ''
  let html = ''

  if (type === 'approved') {
    subject = `You're approved for ${eventTitle} — Complete your registration`
    const steps = []
    steps.push(`<li style="margin-bottom:8px;">💳 <strong>Payment:</strong> Complete your pass payment to secure your spot.</li>`)
    if (requireIdVerification) {
      steps.push(`<li style="margin-bottom:8px;">🪪 <strong>ID Verification:</strong> You will need to present a valid government-issued ID at the door.</li>`)
    }
    if (requireReferenceCode && referenceCode) {
      steps.push(`<li style="margin-bottom:8px;">🔑 <strong>Reference Code:</strong> Your entry reference code is <strong style="color:#1E5EFF;font-size:18px;letter-spacing:2px;">${referenceCode}</strong>. Keep this safe.</li>`)
    }

    html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0F1117;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:#1E5EFF;padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:700;">You are Approved!</h1>
      </div>
      <div style="padding:32px;">
        <p style="color:#9ca3af;margin-top:0;">Hi ${firstName},</p>
        <p style="color:#9ca3af;">Great news - you have been approved to attend <strong style="color:#fff;">${eventTitle}</strong>.</p>
        <p style="color:#fff;font-weight:600;margin-bottom:12px;">To complete your registration, please:</p>
        <ul style="color:#9ca3af;padding-left:20px;line-height:1.8;">
          ${steps.join('')}
        </ul>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you have any questions, reply to this email.</p>
        <p style="color:#6b7280;font-size:12px;">The Tikkit Team</p>
      </div>
    </div>`
  } else {
    subject = `Update on your registration for ${eventTitle}`
    html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0F1117;color:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:#1f2937;padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:700;">Registration Update</h1>
      </div>
      <div style="padding:32px;">
        <p style="color:#9ca3af;margin-top:0;">Hi ${firstName},</p>
        <p style="color:#9ca3af;">Thank you for your interest in <strong style="color:#fff;">${eventTitle}</strong>.</p>
        <p style="color:#9ca3af;">Unfortunately, we are unable to accommodate your registration at this time. This may be due to capacity limits or event criteria.</p>
        <p style="color:#9ca3af;">We hope to see you at a future event.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">The Tikkit Team</p>
      </div>
    </div>`
  }

  try {
    await resend.emails.send({
      from: 'Tikkit <onboarding@resend.dev>',
      to: email,
      subject,
      html,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}