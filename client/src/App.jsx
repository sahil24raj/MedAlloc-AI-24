import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Plus, LayoutDashboard, Calendar, Radio } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import AppointmentBooking from './components/AppointmentBooking';
import LiveQueueTracker from './components/LiveQueueTracker';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function NavLink({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
        isActive 
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <Icon className="w-4 h-4" />
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 rounded-none border-x-0 border-t-0 flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
            <Activity className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
              MedAlloc AI
            </span>
            <span className="text-[9px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">Smart Hospital System — India</span>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
          <NavLink to="/intake" icon={Plus}>Patient Intake</NavLink>
          <NavLink to="/booking" icon={Calendar}>Appointment</NavLink>
          <NavLink to="/queue" icon={Radio}>Live Queue</NavLink>
        </div>
      </nav>

      {/* Alerts */}
      <div className="fixed top-16 right-6 z-50 space-y-2">
        {alerts.map((msg, idx) => (
          <div key={idx} className="bg-red-500/90 text-white px-5 py-3 rounded-xl shadow-2xl shadow-red-500/20 flex items-center space-x-3 animate-pulse backdrop-blur-sm border border-red-400/30">
            <Activity className="w-5 h-5" />
            <span className="font-semibold text-sm">{msg}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <Routes>
          <Route path="/" element={<Dashboard socket={socket} />} />
          <Route path="/intake" element={<PatientForm />} />
          <Route path="/booking" element={<AppointmentBooking />} />
          <Route path="/queue" element={<LiveQueueTracker socket={socket} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center">
        <p className="text-xs text-slate-600">
          🏥 MedAlloc AI — AI-Powered Smart Hospital Resource Allocation System | Made in India 🇮🇳
        </p>
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
