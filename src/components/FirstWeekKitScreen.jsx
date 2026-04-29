import { CAT_LABELS } from '../data/defaults';

const CHECK_SVG = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FirstWeekKitScreen({ kit, onToggle, onNavigate }) {
  // Group by category preserving order
  const groups = {};
  kit.items.forEach((item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  const doneCount = kit.items.filter((i) => i.done).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="kit-header">
        <div>
          <h2 className="kit-title">First Week Kit</h2>
          <p className="kit-sub">Days 1–7 essentials · {doneCount} of {kit.items.length} done</p>
        </div>
        <button className="nav-icon-btn" onClick={() => onNavigate('s3')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="#2C2A27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="scroll-area" id="kit-scroll-area">
        {Object.entries(groups).map(([cat, items]) => (
          <div className="kit-section" key={cat}>
            <div className="kit-section-title">{CAT_LABELS[cat] || cat}</div>
            {items.map((item) => (
              <div key={item.id} className={`kit-item${item.done ? ' done' : ''}`} onClick={() => onToggle(item.id)}>
                <div className="kit-check">{item.done ? CHECK_SVG : null}</div>
                <div className="kit-item-info">
                  <div className="kit-item-task">{item.task}</div>
                  <div className="kit-item-place">
                    → {item.place}{item.distance ? `, ${item.distance}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ height:32 }} />
      </div>
    </div>
  );
}
