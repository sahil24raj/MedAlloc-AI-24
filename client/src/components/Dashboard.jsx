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

    socket.on('resource_update', () => {
      fetchData();
    });
    socket.on('new_patient', () => {
      fetchData();
    });

    return () => {
      socket.off('resource_update');
      socket.off('new_patient');
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const [hRes, pRes] = await Promise.all([
        axios.get(`${API_URL}/api/hospitals`),
        axios.get(`${API_URL}/api/patients`)
      ]);
      setHospitals(hRes.data);
      setPatients(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = {
    labels: hospitals.map(h => h.name),
    datasets: [
      {
        label: 'ICU Beds Available',
        data: hospitals.map(h => h.resources.icu_beds),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
      {
        label: 'General Beds Available',
        data: hospitals.map(h => h.resources.general_beds),
        backgroundColor: 'rgba(52, 211, 153, 0.8)',
      }
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Hospital Resource Overview</h1>
        <p className="text-slate-400 mt-2">Real-time monitoring of beds, oxygen, and resources across all facilities.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resource Chart */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6">Bed Availability</h2>
          <div className="h-80">
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: {
                  y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                  x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
              }} 
            />
          </div>
        </div>

        {/* Recent Patients */}
        <div className="glass-panel p-6 flex flex-col h-[26rem]">
          <h2 className="text-xl font-semibold mb-4">Recent Patient Allocations</h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-4 custom-scrollbar">
            {patients.map(p => (
              <div key={p._id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50 flex justify-between items-center hover:bg-slate-700/50 transition">
                <div>
                  <h3 className="font-semibold text-lg">{p.name} <span className="text-sm text-slate-400 font-normal">({p.age}y)</span></h3>
                  <p className="text-sm text-slate-300 mt-1">Status: {p.status}</p>
                  <p className="text-sm text-emerald-400 mt-1">Hospital: {p.allocated_hospital ? p.allocated_hospital.name : 'Unallocated'}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    p.priority_label === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    p.priority_label === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {p.priority_label} Priority
                  </span>
                  <span className="text-xs text-slate-400 mt-2">Score: {p.priority_score}</span>
                </div>
              </div>
            ))}
            {patients.length === 0 && <p className="text-slate-400 text-center py-8">No patients admitted yet.</p>}
          </div>
        </div>
      </div>
      
      {/* Cards for each hospital's exact numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map(h => (
          <div key={h._id} className="glass-panel p-6 hover:-translate-y-1 transition-transform">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">{h.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <span className="block text-slate-400">ICU Beds</span>
                <span className="text-2xl font-semibold text-white">{h.resources.icu_beds}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <span className="block text-slate-400">General Beds</span>
                <span className="text-2xl font-semibold text-white">{h.resources.general_beds}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <span className="block text-slate-400">O₂ Cylinders</span>
                <span className="text-xl font-semibold text-white">{h.resources.oxygen_cylinders}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <span className="block text-slate-400">Ventilators</span>
                <span className="text-xl font-semibold text-white">{h.resources.ventilators}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
