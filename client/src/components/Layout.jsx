import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, LogOut, User, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav>
      <Link to="/" className="nav-logo">
        <Package size={22} />
        PackCycle
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {user ? (
          <>
            {user.role === 'admin' && <Link to="/dashboard" className="nav-link"><LayoutDashboard size={14} style={{ display:'inline', marginRight:'0.3rem', verticalAlign:'middle' }} />Dashboard</Link>}
            <Link to="/track" className="nav-link">Track</Link>
            <div className="user-pill">
              <User size={14} color="var(--primary)" />
              <span>{user.name}</span>
              <button onClick={() => { logout(); navigate('/'); }} title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}

export function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="app-container">
          {children}
        </div>
      </main>
    </>
  );
}
