import { useState } from 'react';
import { getMissionPhoto } from '../services/storage';
import { PREF_EMOJI } from '../services/placesApi';

const TYPE_ICON = {
  ...PREF_EMOJI,
  cook:    '🍳',
  eat_out: '🚶',
  visit:   '📍',
};

function MemoryDetailModal({ entry, photo, icon, onClose }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.85)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'flex-end',
      }}
    >
      <div style={{
        width:'100%', maxHeight:'92vh',
        background:'var(--bg2)', borderRadius:'28px 28px 0 0',
        border:'1px solid var(--border)', borderBottom:'none',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Close bar */}
        <div style={{
          display:'flex', justifyContent:'flex-end',
          padding:'16px 20px 0',
        }}>
          <button className="icon-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="var(--fg2)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Photo */}
        <div style={{ width:'100%', flexShrink:0 }}>
          {photo ? (
            <img
              src={photo}
              alt={entry.place}
              style={{ width:'100%', maxHeight:320, objectFit:'cover', display:'block' }}
            />
          ) : (
            <div style={{
              width:'100%', height:200,
              background:'var(--card)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:48,
            }}>
              {icon}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ padding:'24px 24px 48px', overflowY:'auto' }}>
          {/* Place */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{
              width:48, height:48, borderRadius:14, background:'var(--card2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--white)', letterSpacing:'-0.02em' }}>
                {entry.place || entry.type}
              </div>
              <div style={{ fontSize:12, color:'var(--fg3)', marginTop:2 }}>
                {entry.date}{entry.weather ? ` · ${entry.weather}` : ''}
              </div>
            </div>
          </div>

          {/* Note */}
          {entry.note ? (
            <div style={{
              background:'var(--card)', borderRadius:14,
              padding:'14px 16px', marginBottom:12,
              fontSize:14, color:'var(--fg)', lineHeight:1.65, fontStyle:'italic',
            }}>
              "{entry.note}"
            </div>
          ) : null}

          {/* Mood */}
          {entry.mood ? (
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(200,240,75,0.08)', border:'1px solid rgba(200,240,75,0.2)',
              borderRadius:100, padding:'6px 14px',
              fontSize:13, color:'var(--accent)', fontWeight:600,
            }}>
              {entry.mood}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MemoryScreen({ missions, profile, onNavigate }) {
  const { history = [], anchors = [], streak = 0, total_completed = 0 } = missions;
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const startedAt = profile.started_at ? new Date(profile.started_at) : null;
  const dayCount = startedAt && !Number.isNaN(startedAt.getTime())
    ? Math.max(1, Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : streak;
  const filteredHistory = normalizedQuery
    ? history.filter((entry) => {
        const place = (entry.place || entry.type || '').toLowerCase();
        const date = (entry.date || '').toLowerCase();
        return place.includes(normalizedQuery) || date.includes(normalizedQuery);
      })
    : history;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding:'52px 24px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--accent)', marginBottom:10 }}>
            Your story
          </div>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--white)', letterSpacing:'-0.03em', lineHeight:1.15 }}>
            {profile.name || 'Neighbor'}
          </h2>
          <p style={{ fontSize:13, color:'var(--fg3)', marginTop:4 }}>
            {profile.neighborhood || ''} · {total_completed} missions completed
          </p>
        </div>
        <button className="icon-btn" onClick={() => onNavigate('s2')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="var(--fg2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="scroll-area" style={{ paddingBottom:80 }}>

        {/* Stats */}
        <div style={{ display:'flex', gap:10, padding:'0 20px 20px' }}>
          {[
            { num: dayCount,        label:'D+ days' },
            { num: total_completed, label:'Missions' },
            { num: anchors.length,  label:'Anchors' },
          ].map(({ num, label }) => (
            <div className="stat-card" key={label}>
              <div className="stat-num">{num}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* Anchors */}
        {anchors.length > 0 && (
          <>
            <div className="sec-label">Anchor places</div>
            <div style={{ padding:'0 20px 16px', display:'flex', flexWrap:'wrap', gap:8 }}>
              {anchors.map(a => (
                <div key={a} style={{
                  background:'rgba(200,240,75,0.1)', border:'1px solid rgba(200,240,75,0.25)',
                  borderRadius:100, padding:'7px 14px',
                  fontSize:13, color:'var(--accent)', fontWeight:600,
                }}>
                  📍 {a}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Mission log */}
        <div className="sec-label">Mission log</div>

        <div style={{ padding:'0 20px 16px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by place or date (e.g. 7-Eleven, 2026-04-29)"
            style={{
              width:'100%',
              padding:'14px 16px',
              borderRadius:14,
              border:'1px solid var(--border)',
              background:'var(--card)',
              color:'var(--fg)',
              fontFamily:'var(--sans)',
              fontSize:14,
              outline:'none',
              boxSizing:'border-box',
            }}
          />
        </div>

        {history.length === 0 ? (
          <div style={{ padding:'48px 24px', textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🎙️</div>
            <p style={{ fontSize:14, color:'var(--fg3)', lineHeight:1.7 }}>
              Your missions will appear here after your first radio session.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding:'36px 24px', textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:12 }}>🔎</div>
            <p style={{ fontSize:14, color:'var(--fg3)', lineHeight:1.7 }}>
              No mission log matches that place or date.
            </p>
          </div>
        ) : filteredHistory.map((h, i) => {
          const photo = getMissionPhoto(h.date, h.place);
          const icon  = TYPE_ICON[h.type] || '📍';
          return (
            <div key={i} style={{
              margin:'0 20px 10px',
              background:'var(--card)', border:'1px solid var(--border)',
              borderRadius:20, overflow:'hidden',
              cursor:'pointer',
            }}>
              <button
                onClick={() => setSelected({ entry: h, photo, icon })}
                style={{
                  width:'100%',
                  border:'none',
                  background:'transparent',
                  padding:0,
                  textAlign:'left',
                  color:'inherit',
                  cursor:'pointer',
                }}
              >
                {/* Photo */}
                {photo && (
                  <img
                    src={photo}
                    alt={h.place}
                    style={{ width:'100%', height:160, objectFit:'cover', display:'block' }}
                  />
                )}

                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:44, height:44, background:'var(--card2)',
                    borderRadius:12, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:20, flexShrink:0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:'var(--fg)', marginBottom:3 }}>
                      {h.place || h.type}
                    </div>
                    <div style={{ fontSize:12, color:'var(--fg3)' }}>
                      {h.date}{h.weather ? ` · ${h.weather}` : ''}
                    </div>
                  </div>
                  <div style={{
                    background:'rgba(200,240,75,0.1)', borderRadius:100,
                    padding:'4px 10px', fontSize:11, color:'var(--accent)', fontWeight:600,
                  }}>
                    Done
                  </div>
                </div>

                {h.note && (
                  <div style={{
                    padding:'0 16px 14px 72px', fontSize:13, color:'var(--fg3)',
                    fontStyle:'italic',
                  }}>
                    "{h.note}"
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => onNavigate('s2')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="var(--fg3)" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="2.5" fill="var(--fg3)"/>
            <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="var(--fg3)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Radio</span>
        </div>
        <div className="nav-item active">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="var(--accent)" strokeWidth="1.5"/>
          </svg>
          <span>Memory</span>
        </div>
      </div>

      {selected && (
        <MemoryDetailModal
          entry={selected.entry}
          photo={selected.photo}
          icon={selected.icon}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
