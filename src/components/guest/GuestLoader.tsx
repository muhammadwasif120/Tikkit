/* ─── GuestLoader ─────────────────────────────────────────────────────
   Unified shimmer skeleton for guest pages without a dedicated skeleton.
   Matches the visual style of SkeletonExplore / SkeletonTikkit.
────────────────────────────────────────────────────────────────────── */
export default function GuestLoader() {
  return (
    <div className="skeleton-screen" style={{ padding: '20px 16px' }}>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <div className="skeleton skeleton-title" style={{ width: 140, marginBottom: 6 }} />
        <div className="skeleton skeleton-text" style={{ width: 200 }} />
      </div>

      {/* Cards */}
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="skeleton-card"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div className="skeleton" style={{ height: 80, borderRadius: 0 }} />
          <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton skeleton-title" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
      ))}

      {/* List rows */}
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 12, padding: '12px 0',
            borderBottom: '1px solid var(--guest-border)',
            alignItems: 'center',
          }}
        >
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton skeleton-title" style={{ width: '70%' }} />
            <div className="skeleton skeleton-text" style={{ width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
