export default function OrganizerProfileLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#050608', overflowX: 'hidden' }}>
      {/* Banner */}
      <div className="skeleton" style={{ height: 280, borderRadius: 0 }} />
      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 48px' }}>
        {/* Avatar */}
        <div style={{ marginTop: -40, marginBottom: 20 }}>
          <div className="skeleton skeleton-circle" style={{ width: 80, height: 80 }} />
        </div>
        <div className="skeleton skeleton-title" style={{ width: 200, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 140, marginBottom: 32 }} />
        {/* Event cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
