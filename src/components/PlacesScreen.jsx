import { useState } from 'react';
import { BottomNav } from './HomeScreen';

function PlaceCard({ place, onNoteOpen }) {
  return (
    <div className="place-card" onClick={!place.visited ? () => onNoteOpen(place.id) : undefined}>
      <div className="place-card-header">
        <div className="place-icon">{place.icon}</div>
        <div className="place-info">
          <div className="place-name">{place.name}</div>
          <div className="place-cat">{place.category}</div>
          <div className="place-dist">{place.distance}</div>
        </div>
        {place.visited
          ? <div className="visited-badge">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#2C2A27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Visited
            </div>
          : <div style={{ background:'var(--cream)', color:'var(--mid)', fontSize:11, padding:'4px 10px', borderRadius:100, fontWeight:500, whiteSpace:'nowrap' }}>
              Not visited
            </div>
        }
      </div>

      {/* Body */}
      {place.visited && place.note
        ? <div className="place-note">"{place.note}"</div>
        : place.visited
          ? <div style={{ padding:'10px 18px 14px', fontSize:13, color:'var(--blue)', cursor:'pointer' }}
              onClick={(e) => { e.stopPropagation(); onNoteOpen(place.id); }}>
              + Add a note
            </div>
          : <div style={{ padding:'10px 18px 14px', display:'flex', alignItems:'center', gap:8, color:'var(--mid)', fontSize:13 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v4l2.5 2.5" stroke="#AACDDC" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="7" cy="7" r="5.5" stroke="#AACDDC" strokeWidth="1.5"/>
              </svg>
              Tap to mark as visited &amp; add a note
            </div>
      }

      {/* Ambient signal */}
      {!place.visited && place.shared_signals?.length > 0 && (
        <div style={{ padding:'0 18px 12px', fontSize:12, color:'var(--mid)', fontStyle:'italic' }}>
          💬 {place.shared_signals[0]}
        </div>
      )}

      {/* Alt place */}
      <div className="place-alt">
        <span className="alt-label">Alt →</span>
        <span className="alt-name">{place.alt_place}</span>
        <span style={{ fontSize:11, color:'var(--mid)', marginLeft:4 }}>{place.alt_distance}</span>
        <div className="alt-arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 3l3 3-3 3" stroke="#6B6560" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function NoteSheet({ place, onSave, onClose }) {
  const [text, setText] = useState(place?.note || '');
  return (
    <div className="note-overlay open" onClick={onClose}>
      <div className="note-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="note-sheet-title">{place?.name}</div>
        <p style={{ fontSize:13, color:'var(--mid)', marginBottom:14 }}>
          Leave a note — future visitors nearby will hear it.
        </p>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="e.g. The corner booth is cozy on rainy days..." />
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex:1, margin:0, padding:14 }}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(text)} style={{ flex:1, padding:14 }}>Save note ✓</button>
        </div>
      </div>
    </div>
  );
}

export default function PlacesScreen({ places, onSaveVisit, onNavigate }) {
  const [activeNote, setActiveNote] = useState(null); // place id

  const handleSave = (text) => {
    if (text.trim()) onSaveVisit(activeNote, text.trim());
    setActiveNote(null);
  };

  const activePlace = places.find((p) => p.id === activeNote);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="places-header">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h2 className="places-title">Your places</h2>
            <p className="places-sub">Discover · Visit · Leave a note</p>
          </div>
          <button className="nav-icon-btn" onClick={() => onNavigate('s3')} style={{ marginTop:4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="#2C2A27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="scroll-area" style={{ paddingBottom:16 }}>
        {places.map((pl) => (
          <PlaceCard key={pl.id} place={pl} onNoteOpen={setActiveNote} />
        ))}
      </div>

      {activeNote && <NoteSheet place={activePlace} onSave={handleSave} onClose={() => setActiveNote(null)} />}

      <BottomNav active="places" onNavigate={onNavigate} />
    </div>
  );
}
