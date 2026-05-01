import { Link } from 'react-router-dom';
import { MapPin, Eye } from 'lucide-react';

function Home() {
  return (
    <>
      <h1>PackCycle Prototype</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/register" className="btn btn-primary">
          <MapPin size={24} />
          Register Container
        </Link>
        <Link to="/track" className="btn btn-secondary">
          <Eye size={24} />
          Track My Container
        </Link>
      </div>
    </>
  );
}

export default Home;
