import { useState } from 'react';

const CHECK_SVG = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function HomeScreen({ profile, missions, places, daysSinceMoved, onMissionDone, onNavigate, onMenuOpen, fetchBriefing }) {
  const [radioPlaying,  setRadioPlaying]  = useState(false);
  const [briefingText,  setBriefingText]  = useState(missions.briefing_today || null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  const hour    = new Date().getHours();
  const greet   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const unvisited = places.filter((p) => !p.visited).length;

  const handleRadio = async () => {
    const next = !radioPlaying;
    setRadioPlaying(next);
    if (next && !briefingText) {
      setBriefingLoading(true);
      const text = await fetchBriefing();
      if (text) setBriefingText(text);
      else {
        const signals = places.flatMap((p) => p.shared_signals || []).filter(Boolean);
        if (signals.length) setBriefingText(signals[Math.floor(Math.random() * signals.length)]);
      }
      setBriefingLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div className="home-header">
        <div>
          <div className="home-greeting">{greet}, {profile.name || 'Alex'}</div>
          <div className="home-date">{dayName} · Day {daysSinceMoved} in {profile.neighborhood || 'your neighborhood'}</div>
        </div>
        <button className="nav-icon-btn" onClick={onMenuOpen}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 5h12M3 9h12M3 13h12" stroke="#2C2A27" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="home-scroll">
        {/* Mission card */}
        <div className="mission-card">
          <div className="mission-tag">Today's mission</div>
          <div className="mission-title">{missions.today?.title || 'Explore today'}</div>
          <div className="mission-sub">{missions.today?.sub || ''}</div>
          {missions.today?.status === 'done' ? (
            <button className="mission-cta" style={{ background:'rgba(255,255,255,0.15)', cursor:'default' }}>
              ✓ Done today
            </button>
          ) : (
            <button className="mission-cta" onClick={onMissionDone}>
              {CHECK_SVG} I did this
            </button>
          )}
        </div>

        {/* Daily Briefing Radio */}
        <div className="section-label">Daily briefing</div>
        <div className={`radio-card${radioPlaying ? ' playing' : ''}`} onClick={handleRadio}>
          <div className="radio-icon" style={radioPlaying ? { background:'var(--blue-lt)' } : {}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#81A6C6" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" fill="#81A6C6"/>
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#81A6C6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="radio-text">
            <div className="radio-title">Morning Anchor</div>
            <div className="radio-sub">{radioPlaying ? 'Playing now...' : 'Your neighborhood notes for today'}</div>
          </div>
          <div className="radio-play">
            {radioPlaying
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="3" width="3" height="8" rx="1" fill="white"/><rect x="8" y="3" width="3" height="8" rx="1" fill="white"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l7 4-7 4V3z" fill="white"/></svg>
            }
          </div>
        </div>

        {/* Briefing text */}
        {radioPlaying && (
          <div style={{ padding:'0 20px 12px' }}>
            <div style={{ background:'var(--blue-lt)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              {briefingLoading
                ? <span style={{ fontSize:13, color:'var(--dark)', fontStyle:'italic' }}>Tuning in to your neighborhood…</span>
                : <>
                    <div style={{ display:'flex', alignItems:'center', gap:2, height:18, flexShrink:0 }}>
                      {[6,12,18,10,6].map((h, i) => (
                        <div key={i} style={{ width:3, height:h, borderRadius:2, background:'var(--blue)',
                          animation:`wave 1s ease-in-out infinite`, animationDelay:`${i*0.15}s` }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:13, color:'var(--dark)', fontStyle:'italic', lineHeight:1.5 }}>
                      "{briefingText || 'Your neighborhood is becoming yours, one small step at a time.'}"
                    </span>
                  </>
              }
            </div>
          </div>
        )}

        {/* Places teaser */}
        <div className="section-label">Nearby for you</div>
        <div className="radio-card" style={{ cursor:'pointer' }} onClick={() => onNavigate('s4')}>
          <div className="radio-icon" style={{ background:'var(--cream)' }}>
            <span style={{ fontSize:22 }}>☕</span>
          </div>
          <div className="radio-text">
            <div className="radio-title">{places.length} places suggested</div>
            <div className="radio-sub">Based on your preferences · {unvisited} unvisited</div>
          </div>
          <div style={{ marginLeft:'auto' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#81A6C6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

export function BottomNav({ active, onNavigate }) {
  const items = [
    { id:'s3', label:'Home',     icon:(a) => <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke={a?'#81A6C6':'#6B6560'} strokeWidth="1.5"/> },
    { id:'s4', label:'Places',   icon:(a) => <><path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke={a?'#81A6C6':'#6B6560'} strokeWidth="1.5"/><circle cx="10" cy="7" r="2" stroke={a?'#81A6C6':'#6B6560'} strokeWidth="1.5"/></> },
    { id:'s5', label:'Routines', icon:(a) => <><circle cx="10" cy="10" r="7" stroke={a?'#81A6C6':'#6B6560'} strokeWidth="1.5"/><path d="M10 7v3l2 2" stroke={a?'#81A6C6':'#6B6560'} strokeWidth="1.5" strokeLinecap="round"/></> },
  ];
  return (
    <div className="bottom-nav">
      {items.map(({ id, label, icon }) => {
        const isActive = active === label.toLowerCase();
        return (
          <div key={id} className={`nav-item${isActive ? ' active' : ''}`} onClick={() => onNavigate(id)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">{icon(isActive)}</svg>
            <span style={isActive ? { color:'var(--blue)' } : {}}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
