import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, QrCode, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Html5QrcodeScanner } from 'html5-qrcode';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, map.getZoom(), { animate: true }); }, [position, map]);
  return null;
}

export default function TrackContainer() {
  const [tab, setTab] = useState('scan');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isTracking, setIsTracking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [position, setPosition] = useState(null);
  const [containerLabel, setContainerLabel] = useState('');
  const [lastUpdated, setLastUpdated] = useState(0);
  const [signalLost, setSignalLost] = useState(false);
  const [error, setError] = useState('');

  const wsRef = useRef(null);
  const scannerRef = useRef(null);
  const timerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  const connect = (code) => {
    setError('');
    fetch(`/api/room/${code}`)
      .then(r => { if (!r.ok) throw new Error('Invalid code — no active container found'); return r.json(); })
      .then(data => {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setContainerLabel(data.containerLabel);
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
          wsRef.current = ws;
          ws.onopen = () => { setIsTracking(true); setSignalLost(false); ws.send(JSON.stringify({ type: 'watch', roomCode: code })); };
          ws.onmessage = ({ data }) => {
            try {
              const msg = JSON.parse(data);
              if (msg.type === 'location') { setPosition([msg.lat, msg.lng]); lastUpdateRef.current = Date.now(); setLastUpdated(0); setSignalLost(false); }
              if (msg.type === 'container_offline') setSignalLost(true);
            } catch (_) {}
          };
          ws.onclose = () => setSignalLost(true);
          ws.onerror = () => setError('Connection error — please retry');
        }, 900);
      })
      .catch(e => { setError(e.message); setIsTracking(false); });
  };

  useEffect(() => {
    if (!isTracking || signalLost) return;
    timerRef.current = setInterval(() => setLastUpdated(Math.floor((Date.now() - lastUpdateRef.current) / 1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, [isTracking, signalLost]);

  useEffect(() => {
    if (tab === 'scan' && !isTracking) {
      const t = setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 240, height: 240 } }, false);
        scannerRef.current.render((text) => {
          if (/^\d{6}$/.test(text)) { scannerRef.current.clear().catch(() => {}); connect(text); }
        }, () => {});
      }, 100);
      return () => clearTimeout(t);
    }
    return () => { scannerRef.current?.clear().catch(() => {}); };
  }, [tab, isTracking]);

  useEffect(() => () => { wsRef.current?.close(); clearInterval(timerRef.current); }, []);

  const handleOtp = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const otpCode = otp.join('');

  return (
    <div className="flow-container">
      {isSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,185,129,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 80, height: 80, border: '3px solid rgba(255,255,255,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✓</div>
          <h2 style={{ marginTop: '1.25rem', color: '#fff', fontWeight: 700 }}>Code Verified!</h2>
          <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>Connecting to container...</p>
        </div>
      )}

      <div className="flow-back">
        <Link to="/"><ArrowLeft size={20} /></Link>
        <h1>Track Container</h1>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}
      {signalLost && <div className="banner banner-danger">Container signal lost — delivery agent may be out of range.</div>}

      {!isTracking ? (
        <div className="card">
          <div className="tabs">
            <div className={`tab ${tab === 'scan' ? 'active' : ''}`} onClick={() => setTab('scan')}>
              <QrCode size={16} /> Scan QR
            </div>
            <div className={`tab ${tab === 'otp' ? 'active' : ''}`} onClick={() => setTab('otp')}>
              <Hash size={16} /> Enter Code
            </div>
          </div>

          {tab === 'scan' ? (
            <>
              <p className="info-text">Point your camera at the QR code shown on the container screen.</p>
              <div id="reader" />
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (otpCode.length === 6) connect(otpCode); }}>
              <p className="info-text">Enter the 6-digit code displayed on the container screen.</p>
              <div className="otp-container">
                {otp.map((d, i) => (
                  <input
                    key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                    className="otp-box" value={d} placeholder="·"
                    onChange={(e) => handleOtp(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) document.getElementById(`otp-${i-1}`)?.focus(); }}
                  />
                ))}
              </div>
              <button
                type="submit" className="btn btn-primary" style={{ width: '100%', opacity: otpCode.length === 6 ? 1 : 0.45 }}
                disabled={otpCode.length !== 6}
              >
                Start Tracking
              </button>
            </form>
          )}
        </div>
      ) : (
        position ? (
          <div style={{ position: 'relative' }}>
            <div className="map-container">
              <MapContainer center={position} zoom={19} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
                <Marker position={position} />
                <MapUpdater position={position} />
              </MapContainer>
            </div>
            <div className="status-overlay">
              <div className="status-live"><div className="pulse-dot" /> Container is live</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.875rem' }}>{containerLabel}</span>
                <span className="status-meta">Updated {lastUpdated}s ago</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="pulse-container"><div className="pulse-dot" /><span className="pulse-text">Waiting for container location...</span></div>
          </div>
        )
      )}
    </div>
  );
}
