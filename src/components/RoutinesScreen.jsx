import { BottomNav } from './HomeScreen';

export default function RoutinesScreen({ missions, anchorSpots, daysSinceMoved, onNavigate }) {
  const dayLabels = ['M','T','W','T','F','S','S'];
  const todayIdx  = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="routines-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 className="routines-title">My routines</h2>
          <button className="nav-icon-btn" onClick={() => onNavigate('s3')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="#2C2A27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize:13, color:'var(--mid)', marginTop:4 }}>Patterns you're building</p>
      </div>

      <div className="scroll-area">
        {/* Stats */}
        <div className="streak-row">
          {[
            { num: missions.streak || 0, label:'Day streak' },
            { num: anchorSpots.filter((a) => a.visited).length, label:'Places visited' },
            { num: daysSinceMoved, label:'Days since move' },
          ].map(({ num, label }) => (
            <div className="streak-card" key={label}>
              <div className="streak-num">{num}</div>
              <div className="streak-lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* Week strip */}
        <div className="section-label" style={{ padding:'16px 24px 8px' }}>This week</div>
        <div className="week-strip">
          {dayLabels.map((d, i) => {
            const done    = i < todayIdx;
            const isToday = i === todayIdx;
            return (
              <div className="day-dot" key={i}>
                <div className="day-label">{d}</div>
                <div className={`day-circle${done ? ' done' : ''}${isToday ? ' today' : ''}`}>
                  {isToday ? '●' : done ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Anchor spots */}
        <div className="section-label" style={{ padding:'16px 24px 8px' }}>Anchor spots forming</div>
        <div className="routine-list">
          {anchorSpots.map((a) => (
            <div className="routine-item" key={a.place_id} style={!a.visited ? { opacity:0.4 } : {}}>
              <div className="routine-dot" style={{ background: a.visited ? 'var(--blue)' : 'var(--tan)' }} />
              <div className="routine-info">
                <div className="routine-name">{a.label}</div>
                <div className="routine-meta">{a.visited ? a.category : 'Not visited yet'}</div>
              </div>
              <div className="routine-count" style={{ color: a.visited ? 'var(--blue)' : 'var(--tan)' }}>
                {a.visited ? `${a.visit_count}×` : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Mission history */}
        <div className="section-label" style={{ padding:'16px 24px 8px' }}>Mission history</div>
        <div className="routine-list">
          {missions.today && (
            <div className="routine-item">
              <div className="routine-dot" style={{
                background: missions.today.status === 'done' ? 'var(--blue)' : 'var(--cream)',
                border: missions.today.status !== 'done' ? '1.5px solid var(--blue)' : 'none'
              }}/>
              <div className="routine-info">
                <div className="routine-name">{missions.today.title}</div>
                <div className="routine-meta">Today · {missions.today.status === 'done' ? 'Completed' : 'In progress'}</div>
              </div>
            </div>
          )}
          {(missions.history || []).map((h, i) => (
            <div className="routine-item" key={i}>
              <div className="routine-dot" style={{ background:'var(--blue)' }} />
              <div className="routine-info">
                <div className="routine-name" style={{ color:'var(--mid)' }}>{h.title}</div>
                <div className="routine-meta">Day {Math.max(1, daysSinceMoved - 1 - i)} · Completed</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height:24 }} />
      </div>

      <BottomNav active="routines" onNavigate={onNavigate} />
    </div>
  );
}
