import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis as AXAxis } from 'recharts';
import { Package, Activity, CheckCircle, MapPin, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const weeklyData = [
  { day: 'Mon', deliveries: 40 },
  { day: 'Tue', deliveries: 30 },
  { day: 'Wed', deliveries: 65 },
  { day: 'Thu', deliveries: 45 },
  { day: 'Fri', deliveries: 90 },
  { day: 'Sat', deliveries: 120 },
  { day: 'Sun', deliveries: 85 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#0D2B1D', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ color: 'var(--primary)', fontWeight: 700 }}>{payload[0].value} deliveries</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [activeRooms, setActiveRooms] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setActiveRooms(data.activeRooms ?? 0);
      } catch (e) { /* silent fail */ }
    };
    fetchStats();
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { icon: <Package size={18} />, label: 'Total Containers', value: '4,280', trend: '+12% this month' },
    { icon: <Activity size={18} />, label: 'Active Deliveries', value: activeRooms, trend: 'Live count', isLive: true },
    { icon: <CheckCircle size={18} />, label: 'Success Rate', value: '98.4%', trend: '↑ 0.3% vs last week' },
    { icon: <MapPin size={18} />, label: 'Cities Active', value: '12', trend: '3 new this quarter' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <span className="section-eyebrow">Overview</span>
          <h1>Platform Dashboard</h1>
          <p>Real-time view of your circular logistics network, {user?.name}.</p>
        </div>
        <Link to="/register" className="btn btn-primary">+ Register Container</Link>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.isLive ? 'text-gradient' : ''}`}>{s.value}</div>
            <div className="stat-trend"><TrendingUp size={12} /> {s.trend}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Delivery Activity</h3>
          <p className="chart-subtitle">Number of completed deliveries per day this week</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-dim)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-dim)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="deliveries" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Live Flow</h3>
          <p className="chart-subtitle">Simulated throughput curve</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="var(--text-dim)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="deliveries" stroke="var(--primary)" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
