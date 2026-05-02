import { useState, useEffect } from 'react';
import { useRadio } from '../hooks/useRadio';
import { fetchMissionSuggestions, getMapsDirectionsUrl } from '../services/placesApi';
import {
  LS,
  getActivityPrefs,
  getActivityPlaces,
  getMissionSuggestions,
  setMissionSuggestions,
} from '../services/storage';
import MissionCompleteModal from './MissionCompleteModal';

function WaveBar({ active, height, delay }) {
  return (
    <div style={{
      width: 3, borderRadius: 3,
      background: active ? 'var(--accent)' : 'rgba(200,240,75,0.2)',
      height: active ? height : 3,
      transition: 'height 0.12s ease, background 0.3s',
      animation: active ? `wave 0.8s ease-in-out ${delay} infinite` : 'none',
      transformOrigin: 'center',
    }}/>
  );
}

function Waveform({ active }) {
  const bars = [8,14,22,18,10,20,12,24,16,10,18,8,22,14,8];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, height:28 }}>
      {bars.map((h, i) => (
        <WaveBar key={i} active={active} height={h} delay={`${i * 0.06}s`} />
      ))}
    </div>
  );
}

const PHASE_CONFIG = {
  idle:      { label: '',              dot: false },
  opening:   { label: 'Connecting…',  dot: true  },
  listening: { label: 'Listening',    dot: true  },
  speaking:  { label: 'On air',       dot: true  },
  paused:    { label: 'Paused',       dot: false },
  done:      { label: 'Session ended', dot: false },
};

function SkeletonCard() {
  return (
    <div style={{
      margin:'0 20px 10px',
      background:'var(--card)', border:'1px solid var(--border)',
      borderRadius:20, padding:'14px 16px',
      display:'flex', alignItems:'center', gap:12,
      opacity:0.5,
    }}>
      <div style={{ width:44, height:44, borderRadius:12, background:'var(--card2)', flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ height:14, width:'60%', background:'var(--card2)', borderRadius:6, marginBottom:8 }} />
        <div style={{ height:11, width:'40%', background:'var(--card2)', borderRadius:6 }} />
      </div>
    </div>
  );
}

export default function RadioScreen({ userId, profile, weather, missions, onNavigate, onMenuOpen, onMissionComplete }) {
  const { phase, transcript, error, isPaused, isSpeaking, startRadio, pauseRadio, resumeRadio, stopRadio } = useRadio();

  const [suggestions,     setSuggestions]     = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [activeMission,   setActiveMission]   = useState(null);
  const [completedIds,    setCompletedIds]    = useState(new Set());
  const selectedPrefs = getActivityPrefs(userId) || [];
  const expectedMissionCount = Math.max(1, selectedPrefs.length || 3);

  const isActive = phase !== 'idle' && phase !== 'done';
  const isExploringNearby = loadingMissions && suggestions.length < expectedMissionCount;
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const dayName  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  const cfg      = PHASE_CONFIG[phase] || PHASE_CONFIG.idle;

  // Names of every place the user has already completed (cross-session)
  const completedNames = new Set(
    (missions.history || []).map(h => h.place).filter(Boolean)
  );

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    const today = new Date().toISOString().slice(0, 10);

    // Primary: places fetched during PrefsScreen setup (guaranteed real places)
    const stored = getActivityPlaces(userId);
    if (
      stored?.date === today &&
      stored.places?.length > 0 &&
      stored.places.some(m => !m.isFallback && !completedNames.has(m.name))
    ) {
      setSuggestions(stored.places);
      setLoadingMissions(false);
      return;
    }

    // Secondary: per-session mission_suggestions cache
    const cached = getMissionSuggestions(userId);
    const cacheStillFresh =
      cached?.date === today &&
      cached.missions?.length > 0 &&
      cached.missions.some(m => !m.isFallback && !completedNames.has(m.name));

    if (cacheStillFresh) {
      setSuggestions(cached.missions);
      setLoadingMissions(false);
      return;
    }

    // Fallback: fetch live
    setLoadingMissions(true);
    const w     = LS.get('weather');
    const prefs = selectedPrefs;

    const results = await fetchMissionSuggestions({
      lat:          w?.lat,
      lon:          w?.lon,
      neighborhood: profile.neighborhood,
      preferences:  prefs,
      excludeNames: completedNames,
    });

    setSuggestions(results);
    setMissionSuggestions({ date: today, missions: results }, userId);
    setLoadingMissions(false);
  }

  async function handleMissionComplete({ mission, note, photo }) {
    setCompletedIds(prev => new Set([...prev, mission.id]));
    const result = await onMissionComplete({ place: mission.name, note, type: mission.pref, photo });
    if (!result?.success) {
      setCompletedIds(prev => {
        const next = new Set(prev);
        next.delete(mission.id);
        return next;
      });
      return false;
    }
    return result;
  }

  function openMaps(m) {
    window.open(getMapsDirectionsUrl(m, profile.neighborhood), '_blank');
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)', position:'relative' }}>

      {/* ── Status bar ── */}
      <div style={{ padding:'52px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {cfg.dot && (
            <div style={{ position:'relative', width:8, height:8 }}>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'var(--accent)',
                animation:'pulse-ring 1.2s ease-out infinite' }}/>
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'var(--accent)' }}/>
            </div>
          )}
          <span style={{ fontSize:12, fontWeight:600, color: cfg.dot ? 'var(--accent)' : 'var(--fg3)',
            letterSpacing:'0.06em', textTransform:'uppercase' }}>
            {cfg.label || 'Anchor Radio'}
          </span>
        </div>
        <button className="icon-btn" onClick={onMenuOpen}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="var(--fg2)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* ── Hero card ── */}
      <div style={{ margin:'14px 20px 0', background:'var(--card)', borderRadius:24,
        padding:'24px', border:'1px solid var(--border)', position:'relative', overflow:'hidden', flexShrink:0 }}>

        {isActive && (
          <div style={{ position:'absolute', inset:0,
            background:'radial-gradient(ellipse at 80% 20%, rgba(200,240,75,0.07) 0%, transparent 70%)',
            pointerEvents:'none' }}/>
        )}

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:'var(--fg3)', marginBottom:3 }}>
            {dayName} · {profile.neighborhood || ''}
            {weather.description && weather.description !== 'weather unavailable'
              ? ` · ${weather.icon} ${weather.description}` : ''}
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--white)', lineHeight:1.15, letterSpacing:'-0.03em' }}>
            {greeting},<br/>{profile.name || 'neighbor'}
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <Waveform active={isSpeaking && !isPaused} />
        </div>

        {!isActive ? (
          <button onClick={startRadio} style={{
            display:'inline-flex', alignItems:'center', gap:10,
            background:'var(--accent)', color:'#0D0D0D',
            padding:'12px 20px', borderRadius:100, border:'none',
            fontFamily:'var(--sans)', fontSize:14, fontWeight:700,
            cursor:'pointer', letterSpacing:'-0.01em',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
            </svg>
            {phase === 'done' ? 'Start again' : 'Start today radio'}
          </button>
        ) : (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={isPaused ? resumeRadio : pauseRadio} style={{
              display:'inline-flex', alignItems:'center', gap:10,
              background:'rgba(255,255,255,0.08)', color:'var(--fg2)',
              padding:'12px 20px', borderRadius:100,
              border:'1px solid var(--border)',
              fontFamily:'var(--sans)', fontSize:13, cursor:'pointer',
            }}>
              {isPaused ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 2l6 4-6 4V2z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="2" y="2" width="3" height="8" rx="1" fill="currentColor"/>
                  <rect x="7" y="2" width="3" height="8" rx="1" fill="currentColor"/>
                </svg>
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <button onClick={stopRadio} style={{
              display:'inline-flex', alignItems:'center', gap:10,
              background:'rgba(255,255,255,0.02)', color:'var(--fg2)',
              padding:'12px 20px', borderRadius:100,
              border:'1px solid var(--border)',
              fontFamily:'var(--sans)', fontSize:13, cursor:'pointer',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="2" width="8" height="8" rx="1.5" fill="currentColor"/>
              </svg>
              End radio
            </button>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ margin:'10px 20px 0', background:'rgba(255,68,68,0.12)',
          border:'1px solid rgba(255,68,68,0.3)', borderRadius:12,
          padding:'10px 14px', fontSize:13, color:'#FF6B6B', flexShrink:0 }}>
          {error}
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div style={{ flex:1, overflowY:'auto', paddingTop:16, paddingBottom:8 }}>

        {/* Today's stops */}
        <div className="sec-label">Today's stops</div>

        {loadingMissions ? (
          <>{[0,1,2].map(i => <SkeletonCard key={i} />)}</>
        ) : suggestions.length === 0 ? (
          <div style={{ padding:'20px 24px', fontSize:13, color:'var(--fg3)', textAlign:'center' }}>
            Couldn't load suggestions right now.
          </div>
        ) : suggestions.map(m => {
          // Done if completed this session OR present in mission history
          const done = completedIds.has(m.id) || completedNames.has(m.name);
          return (
            <div key={m.id} style={{
              margin:'0 20px 10px',
              background: done ? 'rgba(200,240,75,0.06)' : 'var(--card)',
              border: `1px solid ${done ? 'rgba(200,240,75,0.25)' : 'var(--border)'}`,
              borderRadius:20, padding:'14px 16px',
              display:'flex', alignItems:'center', gap:12,
              transition:'background 0.2s, border-color 0.2s',
            }}>
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background: done ? 'rgba(200,240,75,0.15)' : 'var(--card2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
              }}>
                {done ? '✓' : m.emoji}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize:14, fontWeight:600,
                  color: done ? 'var(--accent)' : 'var(--fg)',
                  marginBottom:3,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                  {m.name}
                </div>
                <div style={{ fontSize:11, color:'var(--fg3)' }}>
                  {m.pref}{m.addr ? ` · ${m.addr}` : ''}
                </div>
              </div>

              <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                {!done && (
                  <button
                    onClick={() => openMaps(m)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      width:44, height:44, borderRadius:12, flexShrink:0,
                      background:'var(--card2)', border:'1px solid var(--border)',
                      cursor:'pointer', gap:2,
                    }}
                    title="Walking directions"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1C4.8 1 3.4 2.4 3.4 4.1c0 2.6 3.1 6.4 3.1 6.4s3.1-3.8 3.1-6.4C9.6 2.4 8.2 1 6.5 1z"
                        stroke="var(--fg2)" strokeWidth="1.1" strokeLinejoin="round"/>
                      <circle cx="6.5" cy="4.1" r="1.2" stroke="var(--fg2)" strokeWidth="1.1"/>
                    </svg>
                    <span style={{ fontSize:8, fontWeight:700, color:'var(--fg3)', letterSpacing:'0.02em' }}>MAP</span>
                  </button>
                )}
                {!done && (
                  <button
                    onClick={() => setActiveMission(m)}
                    style={{
                      padding:'8px 13px', borderRadius:12, height:44,
                      background:'var(--accent)', color:'#0D0D0D',
                      border:'none', fontFamily:'var(--sans)',
                      fontSize:12, fontWeight:700, cursor:'pointer',
                      whiteSpace:'nowrap',
                    }}
                  >
                    I'm here ✓
                  </button>
                )}
                {done && (
                  <div style={{
                    padding:'6px 12px', borderRadius:10,
                    background:'rgba(200,240,75,0.12)',
                    fontSize:11, fontWeight:600, color:'var(--accent)',
                  }}>
                    Done ✓
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Transcript — shown below missions when radio is active */}
        {transcript.length > 0 && (
          <div style={{ marginTop:8 }}>
            <div className="sec-label">Conversation</div>
            <div style={{ padding:'0 20px 8px' }}>
              {transcript.map((t, i) => (
                <div key={i} style={{
                  display:'flex', marginBottom:8,
                  justifyContent: t.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth:'80%', padding:'10px 14px', borderRadius:16,
                    background: t.role === 'ai' ? 'var(--card2)' : 'var(--accent)',
                    color: t.role === 'ai' ? 'var(--fg)' : '#0D0D0D',
                    fontSize:13, lineHeight:1.55, fontWeight: t.role === 'user' ? 600 : 400,
                    borderBottomLeftRadius:  t.role === 'ai'   ? 4 : 16,
                    borderBottomRightRadius: t.role === 'user' ? 4 : 16,
                  }}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="var(--accent)" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="2.5" fill="var(--accent)"/>
            <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Radio</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate('s3')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="var(--fg3)" strokeWidth="1.5"/>
          </svg>
          <span>Memory</span>
        </div>
      </div>

      {/* ── Mission complete modal ── */}
      {activeMission && (
        <MissionCompleteModal
          mission={activeMission}
          onComplete={handleMissionComplete}
          onClose={() => setActiveMission(null)}
        />
      )}

      {isExploringNearby && (
        <div style={{
          position:'absolute',
          inset:0,
          zIndex:180,
          background:'rgba(8, 10, 8, 0.82)',
          backdropFilter:'blur(6px)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:'24px',
        }}>
          <div style={{
            minWidth:220,
            background:'rgba(20, 24, 20, 0.92)',
            border:'1px solid rgba(200,240,75,0.18)',
            borderRadius:24,
            padding:'24px 22px',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            gap:14,
            boxShadow:'0 18px 60px rgba(0,0,0,0.28)',
          }}>
            <Waveform active />
            <div style={{
              fontSize:15,
              fontWeight:700,
              color:'var(--white)',
              letterSpacing:'-0.02em',
            }}>
              Exploring nearby...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
