import Link from 'next/link'
import { TikkitXLogo } from '@/components/ui/TikkitXLogo'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Tikkit X',
  description: 'How Tikkit X collects, uses, and protects your personal data in compliance with Pakistan\'s data protection practices.',
  alternates: { canonical: 'https://www.tikkitx.com/privacy' },
  openGraph: {
    title: 'Privacy Policy — Tikkit X',
    description: 'How Tikkit X collects, uses, and protects your personal data.',
    url: 'https://www.tikkitx.com/privacy',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tikkit X Privacy Policy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — Tikkit X',
    description: 'How Tikkit X collects, uses, and protects your personal data.',
    images: ['/og-image.jpg'],
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#080A10', minHeight: '100vh', color: '#E8EAF0' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <TikkitXLogo size="sm" />
        </Link>
        <Link href="/terms" style={{ fontSize: 13, color: '#7A8494', textDecoration: 'none' }}>
          Terms &amp; Conditions →
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: '#00C2FF', textTransform: 'uppercase', marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: '#7A8494', lineHeight: 1.6 }}>
            Effective Date: 1 April 2026 &nbsp;|&nbsp; Last Updated: 1 April 2026
          </p>
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(0,194,255,0.06)', border: '1px solid rgba(0,194,255,0.15)', borderRadius: 10, fontSize: 14, color: '#9AAAB8', lineHeight: 1.7 }}>
            Two Bit Digital (SMC-PVT) LTD, trading as Tikkit X ("Tikkit X," "we," "us," or "our"), is committed to protecting your privacy. This policy explains how we collect, use, store, and protect your personal information when you use the Tikkit X platform.
          </div>
        </div>

        {/* Sections */}
        <LegalSection number="1" title="Introduction">
          <p>Two Bit Digital (SMC-PVT) LTD, trading as Tikkit X ("Tikkit X," "we," "us," or "our"), is committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use the Tikkit X platform, including our website at tikkitx.com, our mobile applications, and all related services (the "Platform").</p>
          <p>This Privacy Policy should be read together with our Terms and Conditions. By using the Platform, you consent to the collection and use of your personal data as described in this Policy.</p>
        </LegalSection>

        <LegalSection number="2" title="Data Controller">
          <p>The data controller responsible for your personal data is:</p>
          <ContactBox />
          <p>For Event-specific data (Guest Lists, attendee communications, event analytics), the Event Organiser acts as a joint data controller alongside Tikkit X. Tikkit X processes such data on behalf of and under the instructions of the Organiser.</p>
        </LegalSection>

        <LegalSection number="3" title="Personal Data We Collect">
          <SubSection title="3.1 Information You Provide Directly">
            <LegalTable
              headers={['Category', 'Data Elements', 'Purpose']}
              rows={[
                ['Account Registration', 'Full name, email address, phone number, username, password (hashed)', 'Account creation, authentication, communication'],
                ['Identity Verification', 'CNIC number, passport number, identity document images, facial photograph (where applicable)', 'Identity verification, fraud prevention, compliance with anti-scalping obligations'],
                ['Payment Information', 'Payment method, transaction ID, payment screenshots (where applicable), bank/wallet details for Organiser payouts', 'Payment processing, transaction verification, refunds'],
                ['Event Registration', 'Event preferences, EOI submissions, ticket selections, dietary or accessibility requirements (if provided)', 'Event registration, Guest List management, event delivery'],
                ['Organiser Information', 'Company/brand name, event details, venue information, vendor relationships, payout bank details', 'Event listing, payout processing, platform operations'],
                ['Vendor Information', 'Business name, service descriptions, portfolio images, pricing, availability', 'Marketplace listing, booking facilitation, verified profile display'],
                ['Communications', 'Messages sent through in-app chat, support enquiries, feedback', 'Customer support, dispute resolution, platform improvement'],
              ]}
            />
          </SubSection>
          <SubSection title="3.2 Information Collected Automatically">
            <LegalTable
              headers={['Category', 'Data Elements', 'Purpose']}
              rows={[
                ['Device Information', 'Device type, operating system, browser type, screen resolution, unique device identifiers', 'Platform optimisation, security, fraud detection'],
                ['Usage Data', 'Pages viewed, features used, time spent, click patterns, search queries', 'Platform improvement, personalisation, analytics'],
                ['QR Scan Data', 'Scan timestamp, scan location (venue), scan result (valid/invalid), entry/exit records', 'Event check-in, attendance verification, dwell time analytics, audit trail'],
                ['IP Address and Location', 'IP address, approximate geographic location (city/region level)', 'Security, fraud prevention, regional service delivery'],
              ]}
            />
          </SubSection>
        </LegalSection>

        <LegalSection number="4" title="Legal Basis for Processing">
          <LegalTable
            headers={['Legal Basis', 'Applicable Processing Activities']}
            rows={[
              ['Contractual Necessity', 'Processing necessary to perform our contract with you, including account management, ticket issuance, QR code generation, payment processing, and event delivery.'],
              ['Consent', 'Processing based on your explicit consent, including identity verification (CNIC/biometric), marketing communications, and optional profile features. You may withdraw consent at any time by contacting admin@tikkitx.com.'],
              ['Legitimate Interests', 'Processing necessary for our legitimate interests, including fraud prevention, platform security, analytics for service improvement, and enforcement of our Terms.'],
              ['Legal Obligation', 'Processing required to comply with applicable laws, including the Prevention of Electronic Crimes Act 2016 (PECA), tax reporting obligations, and responses to lawful requests from law enforcement or regulatory authorities.'],
            ]}
          />
        </LegalSection>

        <LegalSection number="5" title="How We Use Your Personal Data">
          <ul>
            <li><strong>Platform Operations:</strong> To create and manage your account, process registrations, issue QR Code tickets, facilitate payments, and deliver the core services of the Platform.</li>
            <li><strong>Identity Verification:</strong> To verify your identity through document checks and, where applicable, biometric verification, in order to prevent fraud, scalping, and unauthorised access.</li>
            <li><strong>Event Analytics:</strong> To provide Event Organisers with anonymised and aggregated analytics, including attendance counts, check-in velocity, demographic breakdowns (where consented), and dwell time metrics.</li>
            <li><strong>Communications:</strong> To send you transactional notifications (ticket confirmations, event updates, account alerts), and, with your consent, marketing communications about events and platform features.</li>
            <li><strong>Security and Fraud Prevention:</strong> To monitor for suspicious activity, enforce our anti-scalping policies, maintain audit trails, and protect the integrity of the Platform.</li>
            <li><strong>Platform Improvement:</strong> To analyse usage patterns, conduct research, and improve the functionality, performance, and user experience of the Platform.</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes, including responding to lawful requests from governmental authorities.</li>
          </ul>
        </LegalSection>

        <LegalSection number="6" title="How We Share Your Personal Data">
          <p>We do not sell your personal data. We share your personal data only in the following circumstances:</p>
          <SubSection title="6.1 With Event Organisers">
            <p>When you register for or attend an Event, the Organiser receives your name, email address, ticket status, and check-in data as necessary to manage their Event and Guest List. Organisers are bound by their own privacy obligations and are prohibited from using your data for purposes unrelated to the Event.</p>
          </SubSection>
          <SubSection title="6.2 With Service Providers">
            <p>We share personal data with trusted third-party service providers who assist us in operating the Platform, including:</p>
            <ul>
              <li>Supabase (database hosting and authentication)</li>
              <li>Vercel (application hosting)</li>
              <li>Payment processors (PayPro, JazzCash, EasyPaisa, or others as applicable)</li>
              <li>Identity verification providers (Didit or equivalent KYC services)</li>
              <li>Email service providers (Resend or equivalent)</li>
            </ul>
            <p>These providers process data only on our instructions and are contractually bound to protect your data and use it solely for the purposes of providing their services to us.</p>
          </SubSection>
          <SubSection title="6.3 With Vendors (Tikkit X Vendors)">
            <p>Where you book a Vendor through the Platform, we share necessary booking details (event date, requirements, contact information) with the Vendor to facilitate service delivery.</p>
          </SubSection>
          <SubSection title="6.4 For Legal Reasons">
            <p>We may disclose your personal data where required by law, regulation, legal process, or governmental request, or where we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request.</p>
          </SubSection>
          <SubSection title="6.5 Business Transfers">
            <p>In the event of a merger, acquisition, reorganisation, or sale of all or a portion of our assets, your personal data may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal data.</p>
          </SubSection>
        </LegalSection>

        <LegalSection number="7" title="Cryptographic Data and QR Codes">
          <p>Tikkit X uses cryptographic technology (HMAC-SHA256 with HKDF key derivation) to generate and verify QR Code tickets.</p>
          <ul>
            <li><strong>QR Code Payload:</strong> Your QR Code contains your guest ID, event ID, name, ticket days, status, and timestamp. This payload is cryptographically signed but not encrypted — it is readable by any scanner with the per-event verification key.</li>
            <li><strong>Per-Event Keys:</strong> Verification keys are derived from a master secret using event-specific parameters. Per-event keys are cached on scanner devices for offline verification. Keys are rotated per event and cannot be used to derive the master secret.</li>
            <li><strong>Offline Verification:</strong> QR Code verification can occur without network connectivity. Scan data is stored locally on the scanner device and synchronised with the Platform when connectivity is restored.</li>
            <li><strong>Scan Logs:</strong> All scan events are recorded in an immutable, append-only audit log for security and compliance purposes.</li>
          </ul>
        </LegalSection>

        <LegalSection number="8" title="Data Retention">
          <LegalTable
            headers={['Data Category', 'Retention Period', 'Basis']}
            rows={[
              ['Account Data', 'Duration of account plus 2 years after deletion request', 'Contractual, legal compliance'],
              ['Identity Verification Documents', 'Deleted within 90 days of successful verification', 'Data minimisation'],
              ['Payment Records', '7 years from transaction date', 'Tax and financial reporting obligations'],
              ['Event Check-in / Scan Logs', '3 years from event date', 'Audit trail, dispute resolution'],
              ['In-App Chat Messages', 'Automatically purged 72 hours after event conclusion', 'Privacy by design'],
              ['Usage and Analytics Data', 'Anonymised after 12 months; aggregated data retained indefinitely', 'Platform improvement'],
            ]}
          />
        </LegalSection>

        <LegalSection number="9" title="Data Security">
          <p>We implement appropriate technical and organisational measures to protect your personal data, including:</p>
          <ul>
            <li><strong>Row Level Security (RLS):</strong> Database-level access controls ensuring users can only access data they are authorised to view.</li>
            <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS/HTTPS.</li>
            <li><strong>Encryption at Rest:</strong> Personal data stored in our databases is encrypted at rest.</li>
            <li><strong>Access Controls:</strong> Service role keys and administrative credentials are segregated and never exposed to client-side code.</li>
            <li><strong>Immutable Audit Logs:</strong> Critical operations are recorded in append-only, cryptographically chained audit logs that cannot be altered after creation.</li>
            <li><strong>Rate Limiting:</strong> IP-based rate limiting on sensitive endpoints to prevent brute-force attacks.</li>
          </ul>
          <p>While we take reasonable steps to protect your data, no method of transmission over the internet or electronic storage is 100% secure.</p>
        </LegalSection>

        <LegalSection number="10" title="International Data Transfers">
          <p>The Platform is hosted on infrastructure provided by Supabase (cloud database) and Vercel (application hosting), which may store and process data in jurisdictions outside Pakistan, including the United States and European Union. Where your data is transferred outside Pakistan, we ensure that appropriate safeguards are in place, including contractual protections with our service providers.</p>
          <p>For users in the United Kingdom or European Economic Area, international transfers are conducted in compliance with Chapter V of the UK GDPR or EU GDPR, as applicable, using Standard Contractual Clauses or other approved transfer mechanisms.</p>
        </LegalSection>

        <LegalSection number="11" title="Your Rights">
          <p>Subject to applicable law, you have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Right of Access:</strong> You may request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You may request that we correct inaccurate or incomplete personal data.</li>
            <li><strong>Right to Erasure:</strong> You may request that we delete your personal data, subject to our legal retention obligations.</li>
            <li><strong>Right to Restriction:</strong> You may request that we restrict the processing of your personal data in certain circumstances.</li>
            <li><strong>Right to Data Portability:</strong> You may request a copy of your personal data in a structured, commonly used, machine-readable format.</li>
            <li><strong>Right to Object:</strong> You may object to the processing of your personal data where we rely on legitimate interests as the legal basis.</li>
            <li><strong>Right to Withdraw Consent:</strong> Where processing is based on your consent, you may withdraw that consent at any time without affecting the lawfulness of prior processing.</li>
          </ul>
          <p>To exercise any of these rights, please contact us at <a href="mailto:admin@tikkitx.com" style={{ color: '#00C2FF' }}>admin@tikkitx.com</a>. We will respond within 30 days.</p>
        </LegalSection>

        <LegalSection number="12" title="Children's Privacy">
          <p>The Platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware that we have collected personal data from a child under 18, we will take steps to delete that data promptly. If you believe that a child under 18 has provided us with personal data, please contact us at <a href="mailto:admin@tikkitx.com" style={{ color: '#00C2FF' }}>admin@tikkitx.com</a>.</p>
        </LegalSection>

        <LegalSection number="13" title="Cookies and Tracking Technologies">
          <p>The Platform may use cookies, local storage, and similar technologies to enhance your experience, analyse usage, and provide core functionality. These include:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the Platform to function, including authentication tokens and session management. These cannot be disabled.</li>
            <li><strong>Analytics Cookies:</strong> Used to understand how users interact with the Platform and to improve our services. These are only set with your consent where required by applicable law.</li>
          </ul>
          <p>We do not use third-party advertising cookies or tracking pixels. We do not sell data to advertisers or ad networks.</p>
        </LegalSection>

        <LegalSection number="14" title="Third-Party Links and Services">
          <p>The Platform may contain links to third-party websites, services, or applications. This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services before providing them with your personal data. Tikkit X is not responsible for the privacy practices of third-party services.</p>
        </LegalSection>

        <LegalSection number="15" title="Changes to This Privacy Policy">
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices, the Platform, or applicable laws. Material changes will be communicated to you via email or through a prominent notice on the Platform at least fourteen (14) days before the changes take effect. Your continued use of the Platform after the effective date constitutes your acceptance of the updated Policy.</p>
        </LegalSection>

        <LegalSection number="16" title="Applicable Law">
          <p>This Privacy Policy is governed by the laws of the Islamic Republic of Pakistan, including the Prevention of Electronic Crimes Act, 2016 (PECA), the Electronic Transactions Ordinance, 2002 (ETO), and the constitutional right to privacy under Article 14(1) of the Constitution of Pakistan.</p>
          <p>For users in the United Kingdom, this Policy additionally complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. For users in the European Economic Area, this Policy additionally complies with the EU General Data Protection Regulation (Regulation (EU) 2016/679).</p>
        </LegalSection>

        <LegalSection number="17" title="Contact Us">
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
          <ContactBox />
          <p>For data protection enquiries from the United Kingdom or European Economic Area, you may also contact the relevant supervisory authority in your jurisdiction.</p>
        </LegalSection>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#4A5568' }}>© {new Date().getFullYear()} Two Bit Digital (SMC-PVT) LTD, trading as Tikkit X.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/terms" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
            <Link href="/" style={{ fontSize: 13, color: '#4A5568', textDecoration: 'none' }}>Home</Link>
          </div>
        </div>
      </footer>

      <style>{`
        main p { font-size: 15px; line-height: 1.75; color: #9AAAB8; margin-bottom: 14px; }
        main ul { padding-left: 20px; margin-bottom: 14px; }
        main ul li { font-size: 15px; line-height: 1.75; color: #9AAAB8; margin-bottom: 8px; }
        main strong { color: #C8D0DC; font-weight: 600; }
      `}</style>
    </div>
  )
}

function LegalSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#00C2FF', opacity: 0.6, minWidth: 24 }}>{number}.</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8EAF0', letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 36 }}>{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#C8D0DC', marginBottom: 10 }}>{title}</h3>
      {children}
    </div>
  )
}

function LegalTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, lineHeight: 1.6 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', color: '#C8D0DC', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', color: '#9AAAB8', verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ContactBox() {
  return (
    <div style={{ margin: '14px 0', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 14, color: '#9AAAB8', lineHeight: 1.8 }}>
      <strong style={{ color: '#C8D0DC', display: 'block' }}>Two Bit Digital (SMC-PVT) LTD, trading as Tikkit X</strong>
      Email: <a href="mailto:admin@tikkitx.com" style={{ color: '#00C2FF' }}>admin@tikkitx.com</a><br />
      Website: <a href="https://tikkitx.com" style={{ color: '#00C2FF' }}>https://tikkitx.com</a>
    </div>
  )
}
