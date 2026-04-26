import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, Plus, LayoutDashboard } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function App() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socket.on('alert', (data) => {
      setAlerts((prev) => [...prev, data.message]);
      setTimeout(() => setAlerts((prev) => prev.slice(1)), 10000);
    });
    return () => socket.off('alert');
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
        {/* Navbar */}
        <nav className="glass-panel sticky top-0 z-50 rounded-none border-x-0 border-t-0 flex items-center justify-between px-8 py-4">
          <div className="flex items-center space-x-3">
            <Activity className="text-emerald-400 w-8 h-8" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              MedAlloc AI
            </span>
          </div>
          <div className="flex space-x-6">
            <Link to="/" className="flex items-center space-x-2 hover:text-emerald-400 transition">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/intake" className="flex items-center space-x-2 hover:text-cyan-400 transition">
              <Plus className="w-5 h-5" />
              <span>Patient Intake</span>
            </Link>
          </div>
        </nav>

        {/* Alerts */}
        <div className="fixed top-20 right-8 z-50 space-y-2">
          {alerts.map((msg, idx) => (
            <div key={idx} className="bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 animate-pulse">
              <Activity className="w-5 h-5" />
              <span className="font-semibold">{msg}</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard socket={socket} />} />
            <Route path="/intake" element={<PatientForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
