import { useState } from 'react';
import { ACTIVITY_OPTIONS } from '../data/defaults';
import { fetchMissionSuggestions } from '../services/placesApi';
import { LS, setActivityPlaces } from '../services/storage';

const MAX = 3;

export default function PrefsScreen({ onDone, userId, profileName = '' }) {
  const [selected, setSelected] = useState([]);
  const [fetching, setFetching] = useState(false);

  function toggle(opt) {
    setSelected(prev =>
      prev.includes(opt)
        ? prev.filter(x => x !== opt)
        : prev.length < MAX ? [...prev, opt] : prev
    );
  }

  async function handleDone() {
    setFetching(true);
    try {
      const w    = LS.get('weather');
      const prof = LS.get('user_profile');

      const places = await fetchMissionSuggestions({
        lat:          w?.lat  ?? null,
        lon:          w?.lon  ?? null,
        neighborhood: prof?.neighborhood || null,
        preferences:  selected,
        excludeNames: new Set(),
      });
      setActivityPlaces({ date: new Date().toISOString().slice(0, 10), places }, userId);
    } catch {
      // non-fatal — RadioScreen will fall back to API
    }
    setFetching(false);
    onDone(selected);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding:'64px 28px 24px' }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--accent)', marginBottom:14 }}>
          Today's vibe
        </div>
        <h2 style={{ fontSize:28, fontWeight:800, color:'var(--white)', lineHeight:1.2, letterSpacing:'-0.03em', marginBottom:8 }}>
          What feels good<br/>today{profileName ? `, ${profileName}` : ''}?
        </h2>
        <p style={{ fontSize:14, color:'var(--fg3)', lineHeight:1.6 }}>
          Choose up to {MAX}
        </p>
      </div>

      {/* Options grid */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 28px 24px' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {ACTIVITY_OPTIONS.map(opt => {
            const active    = selected.includes(opt);
            const maxed     = !active && selected.length >= MAX;
            return (
              <button
                key={opt}
                onClick={() => !maxed && toggle(opt)}
                style={{
                  padding:'13px 20px',
                  borderRadius:100,
                  border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                  background: active ? 'rgba(200,240,75,0.12)' : 'var(--card)',
                  color: active ? 'var(--accent)' : maxed ? 'var(--fg3)' : 'var(--fg)',
                  fontFamily:'var(--sans)', fontSize:14, fontWeight: active ? 600 : 400,
                  cursor: maxed ? 'default' : 'pointer',
                  opacity: maxed ? 0.4 : 1,
                  transition:'all 0.15s ease',
                  letterSpacing:'-0.01em',
                }}
              >
                {ICONS[opt]} {opt}
              </button>
            );
          })}
        </div>

        {/* Selection counter */}
        <div style={{ marginTop:24, fontSize:13, color:'var(--fg3)' }}>
          {selected.length === 0
            ? 'Nothing selected yet'
            : `${selected.length} of ${MAX} selected`}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'16px 28px 44px', borderTop:'1px solid var(--border)' }}>
        <button
          className="btn-primary"
          disabled={selected.length === 0 || fetching}
          onClick={handleDone}
        >
          {fetching ? 'Finding your spots…' : selected.length === 0 ? 'Pick at least one' : "Let's go →"}
        </button>
      </div>

    </div>
  );
}

const ICONS = {
  'Coffee':             '☕',
  'Parks':              '🌿',
  'Restaurants':        '🍽️',
  'Groceries':          '🛒',
  'Museums & Galleries':'🖼️',
  'Bookstores':         '📚',
  'Movie Theaters':     '🎬',
};
