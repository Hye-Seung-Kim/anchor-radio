export default function MenuDrawer({ open, profile, onNavigate, onSignOut, onClose }) {
  async function handleSignOutClick() {
    await onSignOut();
    onClose();
  }

  return (
    <div className={`menu-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <div className="menu-drawer" onClick={e => e.stopPropagation()}>
        <div className="menu-name">{profile.name || 'Neighbor'}</div>
        <div className="menu-sub">
          {profile.neighborhood || ''}
          {profile.dietary ? ` · ${profile.dietary}` : ''}
        </div>

        {[
          { id:'s2', label:'Radio',  emoji:'🎙️' },
          { id:'s3', label:'Memory', emoji:'📍' },
        ].map(({ id, label, emoji }) => (
          <div key={id} className="menu-link"
            onClick={() => { onNavigate(id); onClose(); }}>
            <span style={{ fontSize:20 }}>{emoji}</span>
            <span className="menu-link-label">{label}</span>
          </div>
        ))}

        {/* Sign out */}
        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={handleSignOutClick} style={{
            background:'none', border:'1px solid var(--border)',
            borderRadius:10, padding:'12px 16px',
            fontSize:13, fontWeight:500, color:'var(--fg3)',
            cursor:'pointer', fontFamily:'var(--sans)', width:'100%',
            transition:'background 0.15s',
          }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
