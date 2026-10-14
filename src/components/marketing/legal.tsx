import type { ReactNode } from 'react'
import { MarketingShell } from './MarketingShell'

/** Frame for long legal documents. Styles bare p, ul and strong children so the text can stay plain. */
export function LegalPage({ title, effective, intro, children }: { title: string; effective: string; intro: string; children: ReactNode }) {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm text-subtle">{effective}</p>
          <p className="mt-6 rounded-xl bg-surface p-5 text-[15px] leading-relaxed text-muted shadow-card">{intro}</p>
        </header>
        <div className="[&_a]:text-accent [&_a:hover]:underline [&_li]:mb-2 [&_li]:text-[15px] [&_li]:leading-7 [&_li]:text-muted [&_p]:mb-4 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-muted [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </MarketingShell>
  )
}

export function LegalSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-12 border-b border-line pb-12 last:border-0">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="tnum min-w-6 text-xs font-bold text-accent/70">{number}.</span>
        <h2 className="text-xl font-semibold tracking-tight text-fg">{title}</h2>
      </div>
      <div className="sm:pl-9">{children}</div>
    </section>
  )
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2.5 text-sm font-semibold text-fg">{title}</h3>
      {children}
    </div>
  )
}

export function LegalTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-xl shadow-card">
      <table className="w-full border-collapse text-left text-[13px] leading-6">
        <thead>
          <tr>{headers.map(h => <th key={h} scope="col" className="whitespace-nowrap border-b border-line bg-raised px-3.5 py-2.5 font-semibold text-fg">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {row.map((cell, j) => <td key={j} className="px-3.5 py-2.5 align-top text-muted">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ContactBox() {
  return (
    <div className="my-4 rounded-xl bg-surface p-4 text-sm leading-7 text-muted shadow-card">
      <strong className="block text-fg">Two Bit Digital (SMC-PVT) LTD, trading as Tikkit X</strong>
      Email: <a href="mailto:admin@tikkitx.com">admin@tikkitx.com</a><br />
      Website: <a href="https://tikkitx.com">https://tikkitx.com</a>
    </div>
  )
}
