export default function FirstWeekKitIntro({ onOpen, onSkip }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--dark)' }}>
      <div className="s2-top">
        <div className="s2-illo-wrap">
          <svg width="390" height="340" viewBox="0 0 390 340" fill="none">
            <rect width="390" height="340" fill="#3D3A36"/>
            <rect x="280" y="30" width="80" height="100" rx="8" fill="#81A6C6" opacity="0.25"/>
            <line x1="320" y1="30" x2="320" y2="130" stroke="#81A6C6" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
            <line x1="280" y1="80" x2="360" y2="80" stroke="#81A6C6" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
            <rect x="0" y="240" width="390" height="100" fill="#2C2A27" opacity="0.8"/>
            <rect x="80" y="160" width="100" height="80" rx="6" fill="#D2C4B4"/>
            <rect x="80" y="160" width="100" height="20" rx="6" fill="#C4B5A4"/>
            <rect x="200" y="170" width="80" height="70" rx="6" fill="#AACDDC" opacity="0.7"/>
            <path d="M240 170 Q238 150 245 135" stroke="#6B9E6B" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="245" cy="132" r="10" fill="#7DB87D" opacity="0.8"/>
            <rect x="60" y="205" width="50" height="35" rx="4" fill="#F3E3D0"/>
            <g transform="translate(155,120)">
              <path d="M20 80 Q10 100 8 120" stroke="#F3E3D0" strokeWidth="8" strokeLinecap="round" fill="none"/>
              <rect x="8" y="55" width="30" height="30" rx="8" fill="#2C2A27"/>
              <circle cx="23" cy="42" r="18" fill="#F3E3D0"/>
              <path d="M5 38 Q6 22 23 20 Q40 22 41 38" fill="#2C2A27"/>
              <circle cx="17" cy="40" r="2" fill="#2C2A27"/>
              <circle cx="29" cy="40" r="2" fill="#2C2A27"/>
              <rect x="38" y="58" width="24" height="30" rx="3" fill="#FAFAF8"/>
              <path d="M41 64 L59 64 M41 70 L56 70 M41 76 L52 76" stroke="#D2C4B4" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          </svg>
        </div>
      </div>
      <div className="s2-bottom">
        <div className="kit-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5Z" fill="#81A6C6"/>
          </svg>
          One-time setup
        </div>
        <h2 className="s2-title">Your First Week<br />Kit is ready</h2>
        <p className="s2-desc">
          We've mapped out everything you'll need in your first 7 days — one task, one place at a time. No overwhelm.
        </p>
        <button className="btn-primary" onClick={onOpen}>Open my kit →</button>
        <button className="btn-secondary" onClick={onSkip}>Maybe later</button>
      </div>
    </div>
  );
}
