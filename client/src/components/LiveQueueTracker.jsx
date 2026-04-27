import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LiveQueueTracker({ socket }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/hospitals`).then(res => {
      setHospitals(res.data);
      if (res.data.length > 0) setSelectedHospital(res.data[0]._id);
    }).catch(console.error);
  }, []);

  useEffect(() => { if (selectedHospital) fetchQueue(); }, [selectedHospital]);

  useEffect(() => {
    if (socket) {
      socket.on('appointment_new', (data) => { if (data.appointment.hospital_id === selectedHospital) setQueue(prev => [...prev, data.appointment]); });
      socket.on('appointment_update', (data) => { if (data.appointment.hospital_id === selectedHospital) fetchQueue(); });
      return () => { socket.off('appointment_new'); socket.off('appointment_update'); };
    }
  }, [socket, selectedHospital]);

  const fetchQueue = async () => {
    setLoading(true);
    try { const res = await axios.get(`${API_URL}/api/appointments/queue/${selectedHospital}`); setQueue(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try { await axios.put(`${API_URL}/api/appointments/${id}/status`, { status }); } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="neon-text flex items-center gap-3" style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>radio</span>
            LIVE_QUEUE_TRACKER
          </h1>
          <p style={{ color: '#849495', fontFamily: 'Space Grotesk', fontSize: '13px', letterSpacing: '0.05em', marginTop: '4px' }}>
            REAL-TIME CONSULTATION MONITORING
          </p>
        </div>
        <div className="glass-panel flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'rgba(0,219,233,0.2)' }}>
          <span className="material-symbols-outlined" style={{ color: '#849495', fontSize: '18px' }}>local_hospital</span>
          <select className="bg-transparent outline-none" style={{ color: '#e2e2e8', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '13px' }}
            value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}>
            {hospitals.map(h => <option key={h._id} value={h._id} style={{ background: '#111318' }}>{h.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'IN_QUEUE', value: queue.length, color: '#00dbe9', icon: 'groups', sub: 'ACTIVE_CONSULTATIONS' },
          { label: 'AVG_WAIT', value: `${queue.length * 15}m`, color: '#bcff5f', icon: 'schedule', sub: 'UPDATED_LIVE' },
          { label: 'PRIORITY_CASES', value: queue.filter(a => a.priority_level !== 'General').length, color: '#ffb4ab', icon: 'priority_high', sub: 'REQUIRING_ATTENTION' }
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-5" style={{ borderColor: `${stat.color}15` }}>
            <p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em' }}>{stat.label}</p>
            <p style={{ fontSize: '36px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e2e8', marginTop: '4px' }}>{stat.value}</p>
            <div className="mt-3 flex items-center gap-1.5" style={{ fontSize: '11px', color: stat.color, fontFamily: 'Space Grotesk' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{stat.icon}</span>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: 'rgba(30,32,36,0.5)', borderBottom: '1px solid rgba(59,73,75,0.2)' }}>
                {['TOKEN', 'PATIENT', 'DOCTOR', 'PRIORITY', 'EST_TIME', 'ACTIONS'].map(h => (
                  <th key={h} className="px-6 py-4" style={{ fontSize: '10px', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em', color: '#3b494b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map(appt => (
                <tr key={appt._id} className="group transition hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(30,32,36,0.8)' }}>
                  <td className="px-6 py-4"><span className="neon-text" style={{ fontSize: '16px', fontFamily: 'Space Grotesk', fontWeight: 700 }}>#{appt.queue_number}</span></td>
                  <td className="px-6 py-4">
                    <p style={{ color: '#e2e2e8', fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '14px' }}>{appt.patient_name}</p>
                    <p style={{ fontSize: '11px', color: '#3b494b' }}>{appt.problem_type}</p>
                  </td>
                  <td className="px-6 py-4" style={{ fontSize: '13px', color: '#849495', fontFamily: 'Space Grotesk' }}>{appt.doctor_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded" style={{
                      fontSize: '9px', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em',
                      ...(appt.priority_level === 'Emergency' ? { background: 'rgba(147,0,10,0.3)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.2)' } :
                         appt.priority_level === 'Priority' ? { background: 'rgba(188,255,95,0.08)', color: '#bcff5f', border: '1px solid rgba(188,255,95,0.15)' } :
                         { background: 'rgba(30,32,36,0.5)', color: '#849495', border: '1px solid rgba(59,73,75,0.2)' })
                    }}>{appt.priority_level?.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4" style={{ fontSize: '14px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e2e8' }}>
                    {new Date(appt.estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleStatusUpdate(appt._id, 'Completed')}
                      className="opacity-0 group-hover:opacity-100 transition neon-btn px-3 py-1.5 rounded flex items-center gap-1" style={{ fontSize: '10px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span> DONE
                    </button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && !loading && (
                <tr><td colSpan="6" className="px-6 py-12 text-center" style={{ color: '#3b494b', fontFamily: 'Space Grotesk' }}>NO_PATIENTS_IN_QUEUE</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
