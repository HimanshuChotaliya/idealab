import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Package } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, role, name: role === 'admin' ? 'Admin User' : 'Resident' });
    navigate(role === 'admin' ? '/dashboard' : '/track');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon"><Package size={26} /></div>
          <h2>Welcome to PackCycle</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        <div className="role-toggle">
          <button className={`role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
            Admin / Delivery
          </button>
          <button className={`role-btn ${role === 'customer' ? 'active' : ''}`} onClick={() => setRole('customer')}>
            Resident
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email" className="form-input" placeholder="you@packcycle.com"
              required value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" className="form-input" placeholder="••••••••"
              required value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Sign In <LogIn size={17} />
          </button>
        </form>

        <p className="login-hint">Demo mode — any email &amp; password works.</p>
      </div>
    </div>
  );
}
