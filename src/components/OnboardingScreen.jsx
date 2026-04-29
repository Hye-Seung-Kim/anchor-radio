import { useState, useEffect } from 'react';
import { reverseGeocode } from '../services/weatherApi';

export default function OnboardingScreen({ onFinish, loading, initialName = '' }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: initialName, neighborhood: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Geolocation state (step 1) ── */
  const [geoState, setGeoState]     = useState('idle'); // idle | detecting | detected | failed | editing
  const [detectedName, setDetectedName] = useState('');
  const [detectedCoords, setDetectedCoords] = useState(null);

  useEffect(() => {
    if (step === 1) detectLocation();
  }, [step]);

  async function detectLocation() {
    if (!navigator.geolocation) { setGeoState('failed'); return; }
    setGeoState('detecting');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const result = await reverseGeocode(coords.latitude, coords.longitude);
        if (result) {
          setDetectedName(result.name);
          setDetectedCoords({ lat: result.lat, lon: result.lon });
          set('neighborhood', result.name);
          setGeoState('detected');
        } else {
          setGeoState('failed');
        }
      },
      () => setGeoState('failed'),
      { timeout: 8000 }
    );
  }

  const Dots = ({ current, total }) => (
    <div className="progress-dots" style={{ marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`progress-dot${i < current ? ' done' : ''}`} />
      ))}
    </div>
  );

  /* ── Step 0: Name ── */
  if (step === 0) return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)', position:'relative' }}>
      <div className="stripe-bg" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1, padding:'0 32px' }}>
        <div style={{
          width:160, height:160, borderRadius:'50%',
          background:'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)',
          border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:40, fontSize:64,
          boxShadow:'0 0 60px rgba(200,240,75,0.12)',
        }}>🎙️</div>
        <div style={{ textAlign:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--accent)', marginBottom:12 }}>
            Anchor Radio
          </div>
          <h1 style={{ fontSize:32, fontWeight:800, color:'var(--white)', lineHeight:1.15, letterSpacing:'-0.03em' }}>
            What should<br/>I call you?
          </h1>
        </div>
      </div>
      <div style={{ background:'var(--bg2)', borderRadius:'28px 28px 0 0', padding:'28px 28px 44px', border:'1px solid var(--border)', borderBottom:'none', zIndex:1 }}>
        <div style={{ position:'relative', marginBottom:20 }}>
          <input
            type="text" placeholder="Your name" value={form.name} autoFocus
            onChange={e => set('name', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && form.name.trim() && setStep(1)}
            style={{ width:'100%', padding:'16px 48px 16px 18px', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:14, fontFamily:'var(--sans)', fontSize:16, fontWeight:500, color:'var(--fg)', outline:'none' }}
          />
          <div style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', color:'var(--fg3)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="6" y="1" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 9c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <button className="btn-primary" disabled={!form.name.trim()} onClick={() => setStep(1)}>
          Continue
        </button>
      </div>
    </div>
  );

  /* ── Step 1: Neighborhood with geolocation ── */
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <div style={{ padding:'56px 28px 20px' }}>
        <Dots current={1} total={2} />
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--accent)', marginBottom:10 }}>
          Step 2 of 2
        </div>
        <h2 style={{ fontSize:26, fontWeight:800, color:'var(--white)', lineHeight:1.2, letterSpacing:'-0.02em' }}>
          Where have you<br/>landed, {form.name}?
        </h2>
      </div>

      <div style={{ flex:1, padding:'8px 28px 24px', display:'flex', flexDirection:'column', justifyContent:'center' }}>

        {/* Detecting */}
        {geoState === 'detecting' && (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:32, marginBottom:16 }}>📍</div>
            <div style={{ fontSize:14, color:'var(--fg3)' }}>Finding your location…</div>
          </div>
        )}

        {/* Detected — confirm or edit */}
        {geoState === 'detected' && (
          <div>
            <div style={{ background:'var(--card)', borderRadius:20, padding:'24px', border:'1px solid var(--border)', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'var(--fg3)', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Detected location</div>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--white)', marginBottom:4 }}>{detectedName}</div>
              <div style={{ fontSize:13, color:'var(--fg3)' }}>Is this your neighborhood?</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                className="btn-primary"
                style={{ flex:2 }}
                onClick={() => onFinish(detectedCoords ? { ...form, ...detectedCoords } : form)}
                disabled={loading}
              >
                {loading ? 'Setting up…' : `Yes, that's me →`}
              </button>
              <button
                className="btn-ghost"
                style={{ flex:1 }}
                onClick={() => { setGeoState('editing'); setDetectedCoords(null); set('neighborhood', ''); }}
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Manual input — failed detection or user chose to edit */}
        {(geoState === 'failed' || geoState === 'editing') && (
          <div>
            {geoState === 'failed' && (
              <div style={{ fontSize:13, color:'var(--fg3)', marginBottom:20, textAlign:'center' }}>
                Couldn't detect your location automatically.
              </div>
            )}
            <div className="field">
              <label>Your neighborhood</label>
              <input
                type="text"
                placeholder="e.g. Williamsburg, Brooklyn"
                value={form.neighborhood}
                autoFocus
                onChange={e => set('neighborhood', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && form.neighborhood.trim() && !loading && onFinish(form)}
              />
              <p className="hint">Neighborhood-level only — not your exact address.</p>
            </div>
            <button
              className="btn-primary"
              disabled={!form.neighborhood.trim() || loading}
              onClick={() => onFinish(form)}
            >
              {loading ? 'Setting up…' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
