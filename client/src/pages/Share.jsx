import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Share() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Requesting GPS permission...');
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Generate 6-digit code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(generatedCode);

    // Connect WebSocket
    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'share', roomCode: generatedCode }));
      startTracking(ws, generatedCode);
    };

    ws.onerror = () => {
      setError('Failed to connect to the tracking server.');
    };

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const startTracking = (ws, roomCode) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setStatus('Broadcasting live...');
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'location',
            roomCode,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        }
      },
      (err) => {
        setError(`GPS Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ margin: 0 }}>Share Location</h1>
      </div>

      {error ? (
        <div className="banner">{error}</div>
      ) : (
        <>
          <p className="info-text">Tell this code to the person who wants to watch your location.</p>
          
          <div className="code-display">
            {code || '......'}
          </div>

          <div className="pulse-container">
            <div className="pulse-dot"></div>
            <span className="pulse-text">{status}</span>
          </div>
        </>
      )}
    </>
  );
}

export default Share;
