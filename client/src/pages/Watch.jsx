import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically update map center
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);
  return null;
}

function Watch() {
  const [code, setCode] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [position, setPosition] = useState(null); // [lat, lng]
  const [lastUpdated, setLastUpdated] = useState(0);
  const [signalLost, setSignalLost] = useState(false);
  const [error, setError] = useState('');
  
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const lastUpdateTimestampRef = useRef(Date.now());

  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isWatching && !signalLost) {
      timerRef.current = setInterval(() => {
        const secondsAgo = Math.floor((Date.now() - lastUpdateTimestampRef.current) / 1000);
        setLastUpdated(secondsAgo);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isWatching, signalLost]);

  const handleStartWatching = (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setError('');
    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsWatching(true);
      setSignalLost(false);
      ws.send(JSON.stringify({ type: 'watch', roomCode: code }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'location') {
          setPosition([data.lat, data.lng]);
          lastUpdateTimestampRef.current = Date.now();
          setLastUpdated(0);
          setSignalLost(false);
        } else if (data.type === 'sharer_left') {
          setSignalLost(true);
        }
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    };

    ws.onerror = () => {
      setError('Failed to connect to the tracking server.');
      setIsWatching(false);
    };
    
    ws.onclose = () => {
      if (!signalLost) {
        setSignalLost(true);
      }
    };
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ margin: 0 }}>Watch Location</h1>
      </div>

      {error && <div className="banner">{error}</div>}
      {signalLost && <div className="banner">Signal lost — person may have moved out of range or stopped sharing.</div>}

      {!isWatching ? (
        <form onSubmit={handleStartWatching}>
          <p className="info-text">Enter the 6-digit code provided by the person sharing their location.</p>
          <input
            type="text"
            className="input-field"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Start Watching
          </button>
        </form>
      ) : (
        <>
          {position ? (
            <>
              <div className="map-container">
                <MapContainer center={position} zoom={19} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                  />
                  <Marker position={position} />
                  <MapUpdater position={position} />
                </MapContainer>
              </div>

              <div className="status-card">
                <div className="status-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={`pulse-dot ${signalLost ? 'paused' : ''}`} style={signalLost ? { backgroundColor: 'var(--danger)', animation: 'none' } : {}}></div>
                    <span className="status-value" style={{ color: signalLost ? 'var(--danger)' : 'var(--primary-green)' }}>
                      {signalLost ? 'Tracking offline' : 'Tracking live'}
                    </span>
                  </div>
                </div>
                <div className="status-row">
                  <span className="status-label">Last updated:</span>
                  <span className="status-value">{lastUpdated} seconds ago</span>
                </div>
              </div>
            </>
          ) : (
            <div className="info-text" style={{ marginTop: '3rem' }}>
              Waiting for GPS signal from the sharer...
            </div>
          )}
        </>
      )}
    </>
  );
}

export default Watch;
