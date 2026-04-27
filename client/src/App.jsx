import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import AppointmentBooking from './components/AppointmentBooking';
import LiveQueueTracker from './components/LiveQueueTracker';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function NavLink({ to, icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-2.5 px-4 py-2.5 rounded transition-all text-sm tracking-wide ${
        isActive 
          ? 'neon-btn neon-glow' 
          : 'text-[#849495] hover:text-[#00dbe9] hover:bg-white/[0.03]'
      }`}
      style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '12px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

function AppContent() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socket.on('alert', (data) => {
      setAlerts((prev) => [...prev, data.message]);
      setTimeout(() => setAlerts((prev) => prev.slice(1)), 10000);
    });
    return () => socket.off('alert');
  }, []);

  return (
    <div className="min-h-screen flex flex-col tech-grid relative" style={{ background: '#111318', color: '#e2e2e8' }}>
      {/* Scanline overlay */}
      <div className="scanline" style={{ position: 'fixed', zIndex: 60, pointerEvents: 'none' }}></div>

      {/* Background glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute" style={{ top: '-10%', right: '-10%', width: '600px', height: '600px', background: 'rgba(0, 240, 255, 0.06)', borderRadius: '50%', filter: 'blur(120px)' }}></div>
        <div className="absolute" style={{ bottom: '-20%', left: '-10%', width: '800px', height: '800px', background: 'rgba(149, 228, 0, 0.03)', borderRadius: '50%', filter: 'blur(150px)' }}></div>
      </div>

      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between px-6 py-3" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded flex items-center justify-center neon-glow" style={{ background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)' }}>
            <span className="material-symbols-outlined" style={{ color: '#00dbe9', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div className="flex flex-col">
            <span className="neon-text" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
              MEDALLOC_AI
            </span>
            <span className="sys-footer" style={{ fontSize: '9px', marginTop: '-2px' }}>NEURO-CORE OPS v4.0 — INDIA</span>
          </div>
        </Link>
        <div className="flex items-center space-x-1.5">
          <NavLink to="/" icon="dashboard">Dashboard</NavLink>
          <NavLink to="/intake" icon="person_add">Intake</NavLink>
          <NavLink to="/booking" icon="calendar_month">Booking</NavLink>
          <NavLink to="/queue" icon="radio">Live_Queue</NavLink>
        </div>
      </nav>

      {/* Alerts */}
      <div className="fixed top-16 right-6 z-50 space-y-2">
        {alerts.map((msg, idx) => (
          <div key={idx} className="glass-panel flex items-center space-x-3 px-5 py-3" style={{ borderColor: 'rgba(255, 180, 171, 0.3)', animation: 'pulseGlow 2s infinite' }}>
            <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: '20px' }}>warning</span>
            <span className="chip-danger">{msg}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 relative z-10">
        <Routes>
          <Route path="/" element={<Dashboard socket={socket} />} />
          <Route path="/intake" element={<PatientForm />} />
          <Route path="/booking" element={<AppointmentBooking />} />
          <Route path="/queue" element={<LiveQueueTracker socket={socket} />} />
        </Routes>
      </main>

      {/* Footer — Stitch style */}
      <footer className="fixed bottom-0 w-full px-6 py-3 flex justify-between items-center sys-footer pointer-events-none z-40" style={{ borderTop: '1px solid rgba(0, 219, 233, 0.06)' }}>
        <div>ENCRYPTION: AES-256-GCM | SECTOR: MEDICAL_OPS_INDIA</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="pulse-glow-green inline-block" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#bcff5f' }}></span>
            SYSTEM_STABLE
          </div>
          <div>LATENCY: 14MS</div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
