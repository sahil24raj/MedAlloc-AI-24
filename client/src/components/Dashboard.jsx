import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard({ socket }) {
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchData();
    socket.on('resource_update', () => fetchData());
    socket.on('new_patient', () => fetchData());
    return () => { socket.off('resource_update'); socket.off('new_patient'); };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [hRes, pRes] = await Promise.all([axios.get('/api/hospitals'), axios.get('/api/patients')]);
      
      // Safety checks: API might return HTML on 404 or an error object
      if (Array.isArray(hRes.data)) setHospitals(hRes.data);
      if (Array.isArray(pRes.data)) setPatients(pRes.data);
    } catch (err) { console.error('Dashboard Fetch Error:', err); }
  };

  const safeHospitals = Array.isArray(hospitals) ? hospitals : [];
  const totalICU = safeHospitals.reduce((s, h) => s + (h.resources?.icu_beds || 0), 0);
  const totalGeneral = safeHospitals.reduce((s, h) => s + (h.resources?.general_beds || 0), 0);
  const totalO2 = safeHospitals.reduce((s, h) => s + (h.resources?.oxygen_cylinders || 0), 0);
  const totalVent = safeHospitals.reduce((s, h) => s + (h.resources?.ventilators || 0), 0);

  const chartData = {
    labels: safeHospitals.map(h => h.name || 'Unknown'),
    datasets: [
      { label: 'ICU Bistar', data: safeHospitals.map(h => h.resources?.icu_beds || 0), backgroundColor: 'rgba(255,180,171,0.6)', borderColor: 'rgba(255,180,171,0.8)', borderWidth: 1, borderRadius: 3 },
      { label: 'Saadharan Bistar', data: safeHospitals.map(h => h.resources?.general_beds || 0), backgroundColor: 'rgba(0,219,233,0.5)', borderColor: 'rgba(0,219,233,0.8)', borderWidth: 1, borderRadius: 3 }
    ]
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="neon-text" style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span className="material-symbols-outlined align-middle mr-2" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>monitoring</span>
          HOSPITAL_SANSADHAN_OVERVIEW
        </h1>
        <p style={{ color: '#849495', fontFamily: 'Space Grotesk', fontSize: '13px', letterSpacing: '0.05em', marginTop: '4px' }}>
          SABHI HOSPITALS KA REAL-TIME MONITORING — AIIMS | FORTIS | APOLLO | MEDANTA | MAX
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'ICU_BISTAR', value: totalICU, color: '#ffb4ab', icon: 'bed' },
          { label: 'SAADHARAN_BISTAR', value: totalGeneral, color: '#00dbe9', icon: 'hotel' },
          { label: 'OXYGEN_CYLINDER', value: totalO2, color: '#bcff5f', icon: 'air' },
          { label: 'VENTILATOR', value: totalVent, color: '#aec6ff', icon: 'pulmonology' }
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-5 tech-grid relative overflow-hidden">
            <div className="absolute top-3 right-3"><span className="material-symbols-outlined" style={{ color: stat.color, opacity: 0.2, fontSize: '28px' }}>{stat.icon}</span></div>
            <p className="neon-label" style={{ fontSize: '10px', color: '#849495' }}>{stat.label}</p>
            <p style={{ fontSize: '32px', fontFamily: 'Space Grotesk', fontWeight: 700, color: stat.color, marginTop: '4px' }}>{stat.value}</p>
            <p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', marginTop: '2px' }}>{hospitals.length} HOSPITAL_ACTIVE</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h2 className="neon-label mb-6 flex items-center gap-2" style={{ fontSize: '14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00dbe9' }}>bar_chart</span>
            BISTAR_UPLABDHTA — HOSPITAL WISE
          </h2>
          <div style={{ height: '320px' }}>
            <Bar data={chartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#849495', font: { family: 'Space Grotesk', weight: '600', size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } } },
              scales: { y: { ticks: { color: '#3b494b', font: { family: 'Space Grotesk', size: 11 } }, grid: { color: 'rgba(0,219,233,0.05)' } }, x: { ticks: { color: '#3b494b', font: { family: 'Space Grotesk', size: 10 }, maxRotation: 45 }, grid: { color: 'rgba(0,219,233,0.05)' } } }
            }} />
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col" style={{ height: '26rem' }}>
          <h2 className="neon-label mb-4 flex items-center gap-2" style={{ fontSize: '14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#bcff5f' }}>group</span>
            HAAL_HI_KE_MAREEZ
          </h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {(Array.isArray(patients) ? patients : []).map(p => (
              <div key={p._id} className="p-4 rounded flex justify-between items-center transition hover:bg-white/[0.02]" style={{ background: 'rgba(30,32,36,0.5)', border: '1px solid rgba(59,73,75,0.3)' }}>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '15px', color: '#e2e2e8' }}>
                    {p.name} <span style={{ color: '#849495', fontSize: '12px', fontWeight: 400 }}>({p.age} saal)</span>
                  </h3>
                  <p style={{ fontSize: '12px', color: '#849495', marginTop: '2px' }}>STHITI: <span style={{ color: '#e2e2e8' }}>{p.status?.toUpperCase()}</span></p>
                  <p style={{ fontSize: '12px', color: '#00dbe9', marginTop: '2px' }}>
                    <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '14px' }}>local_hospital</span>
                    {p.allocated_hospital ? p.allocated_hospital.name : 'ABHI TAK NAHI DIYA'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-2.5 py-1 rounded" style={{
                    fontSize: '10px', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em',
                    ...(p.priority_label === 'High' ? { background: 'rgba(147,0,10,0.3)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.2)' } :
                       p.priority_label === 'Medium' ? { background: 'rgba(149,228,0,0.1)', color: '#bcff5f', border: '1px solid rgba(188,255,95,0.15)' } :
                       { background: 'rgba(0,219,233,0.1)', color: '#00dbe9', border: '1px solid rgba(0,219,233,0.15)' })
                  }}>{p.priority_label === 'High' ? 'ZYADA ZARURI' : p.priority_label === 'Medium' ? 'THODA ZARURI' : 'SAADHARAN'}</span>
                  <span style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk' }}>SCORE: {p.priority_score}</span>
                </div>
              </div>
            ))}
            {patients.length === 0 && <p style={{ color: '#3b494b', textAlign: 'center', padding: '2rem 0', fontFamily: 'Space Grotesk' }}>ABHI TAK KOI MAREEZ NAHI AAYA</p>}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Array.isArray(hospitals) ? hospitals : []).map(h => (
          <div key={h._id} className="glass-panel p-6 tech-grid relative overflow-hidden hover:-translate-y-0.5 transition-transform">
            <div className="absolute top-0 right-0 w-24 h-24" style={{ background: 'radial-gradient(circle at top right, rgba(0,219,233,0.06), transparent)' }}></div>
            <h3 className="neon-text mb-4" style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 700 }}>
              <span className="material-symbols-outlined align-middle mr-1.5" style={{ fontSize: '18px' }}>local_hospital</span>
              {h.name}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'ICU', value: h.resources.icu_beds, color: '#ffb4ab' },
                { label: 'SAADHARAN', value: h.resources.general_beds, color: '#00dbe9' },
                { label: 'O2', value: h.resources.oxygen_cylinders, color: '#bcff5f' },
                { label: 'VENTILATOR', value: h.resources.ventilators, color: '#aec6ff' }
              ].map(r => (
                <div key={r.label} className="p-3 rounded" style={{ background: 'rgba(12,14,18,0.6)', border: '1px solid rgba(59,73,75,0.2)' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em' }}>{r.label}</span>
                  <span style={{ fontSize: '22px', fontFamily: 'Space Grotesk', fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(59,73,75,0.2)' }}>
              <span style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk' }}>
                <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '13px' }}>ambulance</span>
                AMBULANCE: <span style={{ color: '#e2e2e8' }}>{h.resources.ambulances}</span>
              </span>
              <span className="pulse-glow inline-block" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00dbe9' }}></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
