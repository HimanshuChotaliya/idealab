import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import mqtt from 'mqtt';

export default function SignContainer() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState(initialCode ? 'Ready to share' : 'Enter code to share');
  const [error, setError] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  
  const clientRef = useRef(null);
  const watchIdRef = useRef(null);

  const startSharing = (e) => {
    if (e) e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setStatus('Connecting to tracking server...');
    setError('');

    // Connect to public MQTT broker
    const client = mqtt.connect('wss://test.mosquitto.org:8081/mqtt');
    clientRef.current = client;

    client.on('connect', () => {
      setStatus('Connected. Requesting GPS...');
      setIsSharing(true);
      
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setStatus('Broadcasting live...');
          const payload = JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          });
          // Publish to unique room topic
          client.publish(`packcycle/room/${code}`, payload);
        },
        (err) => {
          setError(`GPS Error: ${err.message}`);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    });

    client.on('error', (err) => {
      setError(`Connection error: ${err.message}`);
      setIsSharing(false);
    });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (clientRef.current) clientRef.current.end();
    };
  }, []);

  const stopSharing = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (clientRef.current) clientRef.current.end();
    setIsSharing(false);
    setStatus('Sharing stopped.');
  };

  return (
    <div className="flow-container">
      <div className="flow-back">
        <Link to="/"><ArrowLeft size={20} /></Link>
        <h1>Share Location</h1>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {!isSharing ? (
        <div className="card">
          <p className="info-text">Enter the 6-digit code from the container to start sharing your location.</p>
          <form onSubmit={startSharing}>
            <div className="form-group">
              <label>Container Code</label>
              <input
                type="text" className="form-input" placeholder="e.g. 123456"
                value={code} onChange={(e) => setCode(e.target.value)}
                maxLength={6} autoFocus={!initialCode}
                style={{ letterSpacing: '0.25rem', fontSize: '1.25rem', textAlign: 'center' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Start Sharing Location
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="pulse-container" style={{ margin: '2rem auto' }}>
            <div className="pulse-dot" />
            <span className="pulse-text">{status}</span>
          </div>
          <p className="info-text">You are currently sharing your location for container <strong>{code}</strong>.</p>
          <button onClick={stopSharing} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', borderColor: '#ef4444', color: '#ef4444' }}>
            Stop Sharing
          </button>
        </div>
      )}
    </div>
  );
}
