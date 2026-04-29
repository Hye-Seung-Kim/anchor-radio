import { useEffect, useRef, useState } from 'react';

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(null); };
    img.src = objUrl;
  });
}

export default function MissionCompleteModal({ mission, onComplete, onClose }) {
  const [note,    setNote]    = useState('');
  const [photo,   setPhoto]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [photoAlertOpen, setPhotoAlertOpen] = useState(false);
  const [visitAlert, setVisitAlert] = useState(null);
  const fileRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef(null);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    if (!cameraOpen) {
      setCameraReady(false);
      stopCamera();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        setCameraReady(false);
        setCameraError('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setCameraError('Could not access camera.');
        setCameraOpen(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compressImage(file);
    if (b64) setPhoto(b64);
  }

  async function handleComplete() {
    if (!photo) {
      setPhotoAlertOpen(true);
      return;
    }

    setLoading(true);
    try {
      const result = await onComplete({ mission, note, photo });
      if (!result?.success) {
        setLoading(false);
        return;
      }
      stopCamera();
      setVisitAlert({
        isFirstVisit: result.isFirstVisit,
        visitCount: result.visitCount,
      });
    } catch {
      setLoading(false);
    }
  }

  function openCamera() {
    setCameraOpen(true);
  }

  function closeCamera() {
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !cameraReady || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is still getting ready. Try again in a moment.');
      return;
    }

    const MAX = 900;
    const scale = Math.min(1, MAX / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError('Could not capture photo.');
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.78));
    setCameraError('');
    closeCamera();
  }

  return (
    <>
      {!visitAlert && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div style={{
            width: '100%',
            background: 'var(--bg2)',
            borderRadius: '28px 28px 0 0',
            border: '1px solid var(--border)',
            borderBottom: 'none',
            padding: '28px 24px 48px',
          }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>
                  Mission complete
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--white)', letterSpacing:'-0.02em' }}>
                  {mission.emoji} {mission.name}
                </div>
                {mission.addr ? (
                  <div style={{ fontSize:12, color:'var(--fg3)', marginTop:4 }}>{mission.addr}</div>
                ) : null}
              </div>
              <button className="icon-btn" onClick={onClose} style={{ flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="var(--fg2)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Photo upload */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', height: 160, borderRadius: 16, marginBottom: 14,
                background: photo ? 'transparent' : 'var(--card)',
                border: `1.5px dashed ${photo ? 'transparent' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
              }}
            >
              {photo ? (
                <img src={photo} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ textAlign:'center', color:'var(--fg3)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📷</div>
                  <div style={{ fontSize:13 }}>Add a photo</div>
                </div>
              )}
              {photo && (
                <div style={{
                  position:'absolute', bottom:8, right:8,
                  background:'rgba(0,0,0,0.6)', borderRadius:8,
                  padding:'4px 10px', fontSize:11, color:'var(--fg2)',
                }}>
                  Tap to change
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              <button
                type="button"
                onClick={openCamera}
                style={{
                  flex:1,
                  height:44,
                  borderRadius:12,
                  border:'1px solid var(--border)',
                  background:'var(--card)',
                  color:'var(--white)',
                  fontFamily:'var(--sans)',
                  fontSize:13,
                  fontWeight:600,
                  cursor:'pointer',
                }}
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  flex:1,
                  height:44,
                  borderRadius:12,
                  border:'1px solid var(--border)',
                  background:'var(--card)',
                  color:'var(--white)',
                  fontFamily:'var(--sans)',
                  fontSize:13,
                  fontWeight:600,
                  cursor:'pointer',
                }}
              >
                Choose from gallery
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />

            {cameraOpen && (
              <div style={{
                marginBottom:20,
                borderRadius:16,
                overflow:'hidden',
                border:'1px solid var(--border)',
                background:'#000',
              }}>
                <div style={{
                  position:'relative',
                  width:'100%',
                  aspectRatio:'4 / 3',
                  background:'#111',
                }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    onLoadedMetadata={() => setCameraReady(true)}
                    onCanPlay={() => setCameraReady(true)}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  />
                  {!cameraReady && !cameraError && (
                    <div style={{
                      position:'absolute',
                      inset:0,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      background:'rgba(0,0,0,0.35)',
                      color:'var(--fg2)',
                      fontSize:13,
                    }}>
                      Preparing camera...
                    </div>
                  )}
                  {cameraError && (
                    <div style={{
                      position:'absolute',
                      inset:0,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      background:'rgba(0,0,0,0.7)',
                      color:'var(--white)',
                      fontSize:13,
                    }}>
                      {cameraError}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:10, padding:12, background:'var(--card)' }}>
                  <button
                    type="button"
                    onClick={closeCamera}
                    style={{
                      flex:1,
                      height:42,
                      borderRadius:12,
                      border:'1px solid var(--border)',
                      background:'transparent',
                      color:'var(--fg2)',
                      fontFamily:'var(--sans)',
                      fontSize:13,
                      fontWeight:600,
                      cursor:'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    style={{
                      flex:1,
                      height:42,
                      borderRadius:12,
                      border:'none',
                      background: cameraReady ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                      color: cameraReady ? '#0D0D0D' : 'var(--fg3)',
                      fontFamily:'var(--sans)',
                      fontSize:13,
                      fontWeight:700,
                      cursor: cameraReady ? 'pointer' : 'default',
                    }}
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            {/* Note */}
            <textarea
              placeholder="How was it? (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              style={{
                width:'100%', padding:'12px 14px',
                background:'var(--card)', border:'1px solid var(--border)',
                borderRadius:12, fontFamily:'var(--sans)', fontSize:14,
                color:'var(--fg)', resize:'none', outline:'none',
                marginBottom:20, boxSizing:'border-box',
                transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
            />

            <button className="btn-primary" onClick={handleComplete} disabled={loading}>
              {loading ? 'Saving…' : 'Complete mission ✓'}
            </button>
          </div>
        </div>
      )}

      {photoAlertOpen && (
        <div style={{
          position:'fixed',
          inset:0,
          zIndex:120,
          background:'rgba(0,0,0,0.78)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:'24px',
        }}>
          <div style={{
            width:'100%',
            maxWidth:360,
            background:'var(--bg2)',
            border:'1px solid var(--border)',
            borderRadius:24,
            padding:'24px 22px',
            textAlign:'center',
          }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--white)', marginBottom:10 }}>
              Photo required
            </div>
            <div style={{ fontSize:14, color:'var(--fg3)', lineHeight:1.6, marginBottom:20 }}>
              A photo is required before completing this mission.
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setPhotoAlertOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {visitAlert && (
        <div style={{
          position:'fixed',
          inset:0,
          zIndex:130,
          background:'rgba(0,0,0,0.8)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:'24px',
        }}>
          <div style={{
            width:'100%',
            maxWidth:380,
            background:'var(--bg2)',
            border:'1px solid var(--border)',
            borderRadius:24,
            padding:'28px 24px',
            textAlign:'center',
          }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--accent)', marginBottom:10 }}>
              Visit saved
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--white)', lineHeight:1.35, marginBottom:10 }}>
              {visitAlert.isFirstVisit
                ? 'First visit to this place.'
                : `You’ve visited this place ${visitAlert.visitCount} times.`}
            </div>
            <div style={{ fontSize:13, color:'var(--fg3)', marginBottom:22 }}>
              {mission.name}
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </>
  );
}
