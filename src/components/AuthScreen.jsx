import { useState } from 'react';

function SlimeCharacter() {
  return (
    <div style={{ position:'relative', width:88, height:88, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Glow */}
      <div style={{
        position:'absolute', inset:-8,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(200,240,75,0.18) 0%, transparent 70%)',
        animation:'slime-glow 3s ease-in-out infinite',
      }}/>

      {/* Body */}
      <div className="slime-body" style={{
        width:68, height:62,
        background:'linear-gradient(160deg, #D8FF5A 0%, #C8F04B 50%, #A8D63B 100%)',
        borderRadius:'50% 50% 46% 46% / 58% 58% 42% 42%',
        position:'relative',
        animation:'slime-float 2.8s ease-in-out infinite',
        boxShadow:'0 6px 24px rgba(200,240,75,0.3), inset 0 -4px 8px rgba(0,0,0,0.1)',
        cursor:'default',
      }}>
        {/* Shine */}
        <div style={{
          position:'absolute', top:'12%', left:'16%',
          width:14, height:8, borderRadius:'50%',
          background:'rgba(255,255,255,0.55)',
          transform:'rotate(-20deg)',
        }}/>
        {/* Left eye */}
        <div style={{
          position:'absolute', top:'38%', left:'24%',
          width:9, height:9, borderRadius:'50%',
          background:'#1A2800',
          boxShadow:'inset 1px 1px 2px rgba(0,0,0,0.4)',
        }}/>
        {/* Left eye shine */}
        <div style={{
          position:'absolute', top:'36%', left:'27%',
          width:3, height:3, borderRadius:'50%',
          background:'rgba(255,255,255,0.7)',
        }}/>
        {/* Right eye */}
        <div style={{
          position:'absolute', top:'38%', right:'24%',
          width:9, height:9, borderRadius:'50%',
          background:'#1A2800',
          boxShadow:'inset 1px 1px 2px rgba(0,0,0,0.4)',
        }}/>
        {/* Right eye shine */}
        <div style={{
          position:'absolute', top:'36%', right:'27%',
          width:3, height:3, borderRadius:'50%',
          background:'rgba(255,255,255,0.7)',
        }}/>
        {/* Smile */}
        <div style={{
          position:'absolute', bottom:'22%', left:'50%',
          transform:'translateX(-50%)',
          width:16, height:6,
          borderRadius:'0 0 16px 16px',
          border:'2px solid #1A2800',
          borderTop:'none',
        }}/>
        {/* Bottom drip */}
        <div style={{
          position:'absolute', bottom:-9, left:'45%',
          width:9, height:12,
          background:'linear-gradient(180deg, #C8F04B, #A8D63B)',
          borderRadius:'0 0 60% 60%',
        }}/>
      </div>

      {/* Shadow */}
      <div style={{
        position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)',
        width:48, height:7, borderRadius:'50%',
        background:'rgba(200,240,75,0.18)',
        animation:'slime-shadow 2.8s ease-in-out infinite',
      }}/>
    </div>
  );
}

export default function AuthScreen({ onSignIn, onSignUp, loading, error }) {
  const [mode,     setMode]     = useState('signin'); // 'signin' | 'signup'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');

  const handleSubmit = () => {
    if (mode === 'signup') onSignUp(email, password, name);
    else                   onSignIn(email, password);
  };

  const canSubmit = email.trim() && password.length >= 6 &&
    (mode === 'signin' || name.trim());

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)', position:'relative' }}>

      {/* Stripe bg */}
      <div className="stripe-bg" />

      {/* Top area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'0 32px', position:'relative', zIndex:1 }}>
        <div style={{ marginBottom:20 }}>
          <SlimeCharacter />
        </div>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em',
          textTransform:'uppercase', color:'var(--accent)', marginBottom:10 }}>
          Anchor Radio
        </div>
        <h1 style={{ fontSize:28, fontWeight:800, color:'var(--white)',
          letterSpacing:'-0.03em', textAlign:'center', lineHeight:1.2 }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      {/* Form card */}
      <div style={{ background:'var(--bg2)', borderRadius:'28px 28px 0 0',
        padding:'28px 28px 48px', border:'1px solid var(--border)',
        borderBottom:'none', zIndex:1 }}>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:'var(--card)', borderRadius:12,
          padding:4, marginBottom:24, border:'1px solid var(--border)' }}>
          {[
            { val:'signin', label:'Sign in' },
            { val:'signup', label:'Sign up' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setMode(val)} style={{
              flex:1, padding:'9px', borderRadius:9, border:'none',
              fontFamily:'var(--sans)', fontSize:13, fontWeight:600, cursor:'pointer',
              background: mode === val ? 'var(--card2)' : 'transparent',
              color: mode === val ? 'var(--fg)' : 'var(--fg3)',
              transition:'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Name field — signup only */}
        {mode === 'signup' && (
          <div className="field">
            <label>Your name</label>
            <input type="text" placeholder="Alex"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()} />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="Min 6 characters"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)',
            borderRadius:10, padding:'10px 14px', fontSize:13, color:'#FF6B6B', marginBottom:16 }}>
            {error}
          </div>
        )}

        <button className="btn-primary" disabled={!canSubmit || loading} onClick={handleSubmit}>
          {loading ? 'Loading…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
        </button>

        <p style={{ fontSize:12, color:'var(--fg3)', textAlign:'center', marginTop:16, lineHeight:1.6 }}>
          {mode === 'signup'
            ? 'Already have an account? '
            : "Don't have an account? "}
          <span style={{ color:'var(--accent)', cursor:'pointer', fontWeight:600 }}
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  );
}
