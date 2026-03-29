/* ─── Skeleton loader for Event Detail page ──────────────────────── */
export default function SkeletonEventDetail() {
  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .sk-root {
            display: flex !important;
            flex-direction: row !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100svh !important;
            overflow: hidden !important;
            padding-bottom: 0 !important;
            margin: 0 !important;
          }
          .sk-content {
            width: 440px !important;
            flex-shrink: 0 !important;
            height: 100svh !important;
            overflow: hidden !important;
            padding: 24px 20px !important;
            border-right: 1px solid rgba(255,255,255,0.05) !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .sk-hero {
            flex: 1 !important;
            height: 100svh !important;
          }
          .sk-cta {
            position: sticky !important;
            bottom: 0 !important;
            padding: 12px 20px 20px !important;
            background: linear-gradient(to top, #080A10 80%, transparent) !important;
          }
          .sk-mobile-hero { display: none !important; }
        }
        @media (min-width: 1280px) {
          .sk-content { width: 480px !important; }
        }
      `}</style>

      <div className="sk-root" style={{ background: '#080A10', minHeight: '100svh', paddingBottom: 120, fontFamily: 'var(--font-body)' }}>

        {/* Content column (left on desktop, stacked on mobile) */}
        <div className="sk-content" style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Mobile hero */}
          <div className="sk-mobile-hero skeleton" style={{ height: 280, borderRadius: 0, margin: '-20px -20px 0' }} />

          {/* Title + organiser */}
          <div style={{ paddingTop: 4 }}>
            <div className="skeleton" style={{ width: '85%', height: 28, borderRadius: 8, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 12, borderRadius: 6 }} />
          </div>

          {/* 2×2 info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  <div className="skeleton" style={{ width: 14, height: 14, borderRadius: '50%' }} />
                  <div className="skeleton" style={{ width: 40, height: 8, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: '70%', height: 14, borderRadius: 4, marginBottom: 5 }} />
                <div className="skeleton" style={{ width: '50%', height: 9, borderRadius: 4 }} />
              </div>
            ))}
          </div>

          {/* Countdown bar */}
          <div style={{ background: '#0E1018', border: '1px solid rgba(129,140,248,0.12)', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 4 }} />
          </div>

          {/* Price */}
          <div style={{ background: '#0E1018', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '13px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 110, height: 20, borderRadius: 4 }} />
          </div>

          {/* Description */}
          <div>
            <div className="skeleton" style={{ width: 50, height: 14, borderRadius: 4, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: '100%', height: 11, borderRadius: 4, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: '95%', height: 11, borderRadius: 4, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: '75%', height: 11, borderRadius: 4 }} />
          </div>

          {/* Spacer pushes CTA to bottom on desktop */}
          <div style={{ flex: 1 }} />

          {/* CTA */}
          <div className="sk-cta" style={{ padding: '12px 0 0' }}>
            <div className="skeleton" style={{ height: 54, borderRadius: 16, width: '100%' }} />
          </div>
        </div>

        {/* Hero image column (right on desktop, hidden on mobile — shown inline above) */}
        <div className="sk-hero skeleton" style={{ height: 280 }} />
      </div>
    </>
  )
}
