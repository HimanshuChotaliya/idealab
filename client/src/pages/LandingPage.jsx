import { Link } from 'react-router-dom';
import { Package, Shield, Zap, BarChart2, ArrowRight, RefreshCw } from 'lucide-react';

const features = [
  {
    icon: <Shield size={22} />,
    title: 'Secure QR Auth',
    desc: 'Every container is identity-protected using scannable QR codes and dynamic 6-digit OTPs — no app install required.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Real-Time Pipeline',
    desc: 'Sub-2-second location updates powered by WebSockets ensure residents always see exactly where their container is.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Smart Analytics',
    desc: 'Track delivery efficiency, container rotation rates, and active sessions from a unified admin dashboard.',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <header className="hero">
        <div className="hero-content">
          <div className="badge"><RefreshCw size={12} /> Circular Economy Platform</div>
          <h1>
            Real-Time Tracking for<br />
            <span className="text-gradient">Reusable Containers</span>
          </h1>
          <p>
            PackCycle eliminates single-use packaging by giving every reusable container a live digital identity — trackable by residents, managed by admins, proven by data.
          </p>
          <div className="hero-btns">
            <Link to="/login" className="btn btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/sign" className="btn btn-secondary">
              Share Container Location
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="glass-card">
            <Package size={72} className="floating" />
            <div className="glass-line" />
            <div className="glass-line short" />
            <div className="container-id">Container ID: PC-9842</div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="features">
        <div className="features-header">
          <span className="section-eyebrow">Why PackCycle</span>
          <h2>The complete tracking stack,<br />without any hardware</h2>
          <p>A pure software prototype that proves the full pipeline — from QR scan to live map — in under 2 seconds.</p>
        </div>
        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="icon-wrap">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <span className="section-eyebrow">Ready to go green?</span>
        <h2>Start tracking containers today.</h2>
        <Link to="/login" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.05rem' }}>
          Launch Platform <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
