import { useState } from 'react';

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
        <div style={{
          width:80, height:80, borderRadius:'50%',
          background:'linear-gradient(135deg, #1E1E1E, #2A2A2A)',
          border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:36, marginBottom:28,
          boxShadow:'0 0 40px rgba(200,240,75,0.1)',
        }}>
          🎙️
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
