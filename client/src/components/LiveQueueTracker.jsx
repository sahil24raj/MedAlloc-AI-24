import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, ArrowUpRight, Search, Hospital as HospitalIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LiveQueueTracker({ socket }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/hospitals`)
      .then(res => {
        setHospitals(res.data);
        if (res.data.length > 0) setSelectedHospital(res.data[0]._id);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchQueue();
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (socket) {
      socket.on('appointment_new', (data) => {
        if (data.appointment.hospital_id === selectedHospital) {
          setQueue(prev => [...prev, data.appointment]);
        }
      });
      socket.on('appointment_update', (data) => {
        if (data.appointment.hospital_id === selectedHospital) {
          fetchQueue();
        }
      });
      return () => {
        socket.off('appointment_new');
        socket.off('appointment_update');
      };
    }
  }, [socket, selectedHospital]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/appointments/queue/${selectedHospital}`);
      setQueue(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/appointments/${id}/status`, { status });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Users className="text-emerald-400 w-8 h-8" />
            <span>Live Queue Tracker</span>
          </h1>
          <p className="text-slate-400 mt-1">Real-time monitoring of doctor consultations and wait positions.</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-slate-800 p-2 rounded-2xl border border-slate-700">
          <HospitalIcon className="w-5 h-5 text-slate-500 ml-2" />
          <select 
            className="bg-transparent text-white outline-none pr-4 font-semibold"
            value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}
          >
            {hospitals.map(h => <option key={h._id} value={h._id} className="bg-slate-800">{h.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="glass-panel p-6 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">In Queue</p>
          <p className="text-4xl font-black text-white">{queue.length}</p>
          <div className="mt-4 flex items-center text-emerald-400 text-sm">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Active consultations</span>
          </div>
        </div>
        <div className="glass-panel p-6 border-cyan-500/20 bg-cyan-500/5">
          <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Avg Wait Time</p>
          <p className="text-4xl font-black text-white">{queue.length * 15}m</p>
          <div className="mt-4 flex items-center text-cyan-400 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span>Updated live</span>
          </div>
        </div>
        <div className="glass-panel p-6 border-amber-500/20 bg-amber-500/5">
          <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Priority Cases</p>
          <p className="text-4xl font-black text-white">{queue.filter(a => a.priority_level !== 'General').length}</p>
          <div className="mt-4 flex items-center text-amber-400 text-sm">
            <Users className="w-4 h-4 mr-1" />
            <span>Requiring attention</span>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Token</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Patient</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Doctor</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Priority</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Est. Time</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {queue.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-4">
                    <span className="text-lg font-black text-cyan-400">#{appointment.queue_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-semibold">{appointment.patient_name}</p>
                    <p className="text-xs text-slate-500">{appointment.problem_type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-300">{appointment.doctor_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${
                      appointment.priority_level === 'Emergency' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      appointment.priority_level === 'Priority' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {appointment.priority_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">
                      {new Date(appointment.estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => handleStatusUpdate(appointment._id, 'Completed')}
                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white p-2 rounded-lg transition"
                        title="Mark Completed"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No patients currently in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
