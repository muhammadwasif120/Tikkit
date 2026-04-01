export default function GuestLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--guest-bg, #050608)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
          <div className="skeleton skeleton-title" style={{ width: '70%' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%' }} />
          <div className="skeleton skeleton-text" style={{ width: '85%' }} />
        </div>
      </div>
    </div>
  )
}
