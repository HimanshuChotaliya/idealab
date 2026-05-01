import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';

export default function RegisterContainer() {
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!label.trim()) { setError('Please enter a container label'); return; }
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(generatedCode);
    setIsRegistered(true);
    setError('');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', roomCode: generatedCode, containerLabel: label.trim() }));
      startTracking(ws, generatedCode);
    };
    ws.onerror = () => setError('Failed to connect to tracking server.');
  };

  useEffect(() => {
    if (isRegistered && code && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, code, { width: 220, margin: 2, color: { dark: '#10B981', light: '#ffffff' } });
    }
  }, [isRegistered, code]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, []);

  const startTracking = (ws, roomCode) => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus('Broadcasting live...');
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'location', roomCode, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        }
      },
      (err) => setError(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  return (
    <div className="flow-container">
      <div className="flow-back">
        <Link to="/"><ArrowLeft size={20} /></Link>
        <h1>Register Container</h1>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {!isRegistered ? (
        <div className="card">
          <p className="info-text">Enter a label for this container to generate its tracking code.</p>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Container Label</label>
              <input
                type="text" className="form-input" placeholder="e.g. Box-001, Container-A"
                value={label} onChange={(e) => setLabel(e.target.value)} autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Generate Tracking Code
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="info-text" style={{ marginBottom: '1.5rem' }}>
            Show this to the resident — they can <strong>scan the QR</strong> or type the code below.
          </p>
          <div style={{ background: 'white', display: 'inline-flex', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1rem' }}>
            <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
          </div>
          <div className="code-display">{code}</div>
          <div className="pulse-container">
            <div className="pulse-dot" />
            <span className="pulse-text">{status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
