import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, Bed, Wind, Truck, HeartPulse } from 'lucide-react';

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

  const totalICU = hospitals.reduce((sum, h) => sum + h.resources.icu_beds, 0);
  const totalGeneral = hospitals.reduce((sum, h) => sum + h.resources.general_beds, 0);
  const totalO2 = hospitals.reduce((sum, h) => sum + h.resources.oxygen_cylinders, 0);
  const totalVent = hospitals.reduce((sum, h) => sum + h.resources.ventilators, 0);

  const chartData = {
    labels: hospitals.map(h => h.name.replace(', ', '\n')),
    datasets: [
      {
        label: 'ICU Beds',
        data: hospitals.map(h => h.resources.icu_beds),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'General Beds',
        data: hospitals.map(h => h.resources.general_beds),
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
        borderRadius: 6,
      }
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white">🏥 Hospital Resource Overview</h1>
        <p className="text-slate-400 mt-1">Real-time monitoring across all Indian facilities — AIIMS, Fortis, Apollo, Medanta, Max</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 grid-pattern relative overflow-hidden">
          <div className="absolute top-3 right-3"><Bed className="w-5 h-5 text-red-400/30" /></div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Total ICU Beds</p>
          <p className="text-3xl font-black text-red-400 mt-1">{totalICU}</p>
          <p className="text-[10px] text-slate-600 mt-1">{hospitals.length} hospitals</p>
        </div>
        <div className="glass-panel p-5 grid-pattern relative overflow-hidden">
          <div className="absolute top-3 right-3"><HeartPulse className="w-5 h-5 text-emerald-400/30" /></div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">General Beds</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{totalGeneral}</p>
          <p className="text-[10px] text-slate-600 mt-1">All facilities</p>
        </div>
        <div className="glass-panel p-5 grid-pattern relative overflow-hidden">
          <div className="absolute top-3 right-3"><Wind className="w-5 h-5 text-cyan-400/30" /></div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">O₂ Cylinders</p>
          <p className="text-3xl font-black text-cyan-400 mt-1">{totalO2}</p>
          <p className="text-[10px] text-slate-600 mt-1">Stock available</p>
        </div>
        <div className="glass-panel p-5 grid-pattern relative overflow-hidden">
          <div className="absolute top-3 right-3"><Truck className="w-5 h-5 text-amber-400/30" /></div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Ventilators</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{totalVent}</p>
          <p className="text-[10px] text-slate-600 mt-1">Operational</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resource Chart */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Bed Availability — Hospital Wise</span>
          </h2>
          <div className="h-80">
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    labels: { color: '#94a3b8', font: { family: 'Inter', weight: '600' } } 
                  } 
                },
                scales: {
                  y: { 
                    ticks: { color: '#64748b', font: { family: 'Inter' } }, 
                    grid: { color: '#1e293b' } 
                  },
                  x: { 
                    ticks: { color: '#64748b', font: { family: 'Inter', size: 10 }, maxRotation: 45 }, 
                    grid: { color: '#1e293b' } 
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Recent Patients */}
        <div className="glass-panel p-6 flex flex-col h-[26rem]">
          <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <span>Recent Patient Allocations</span>
          </h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {patients.map(p => (
              <div key={p._id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 flex justify-between items-center hover:bg-slate-800/60 transition">
                <div>
                  <h3 className="font-semibold text-base">{p.name} <span className="text-sm text-slate-500 font-normal">({p.age} saal)</span></h3>
                  <p className="text-sm text-slate-400 mt-0.5">Status: <span className="text-white">{p.status}</span></p>
                  <p className="text-sm text-emerald-400 mt-0.5">🏥 {p.allocated_hospital ? p.allocated_hospital.name : 'Unallocated'}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    p.priority_label === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    p.priority_label === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {p.priority_label === 'High' ? '🔴 High' : p.priority_label === 'Medium' ? '🟡 Medium' : '🟢 Low'} Priority
                  </span>
                  <span className="text-xs text-slate-500 mt-2">Score: {p.priority_score}</span>
                </div>
              </div>
            ))}
            {patients.length === 0 && <p className="text-slate-500 text-center py-8">Abhi tak koi patient admit nahi hua.</p>}
          </div>
        </div>
      </div>
      
      {/* Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map(h => (
          <div key={h._id} className="glass-panel p-6 hover:-translate-y-1 transition-transform grid-pattern relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full"></div>
            <h3 className="text-lg font-black text-cyan-400 mb-4">🏥 {h.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">ICU Beds</span>
                <span className="text-2xl font-black text-red-400">{h.resources.icu_beds}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">General Beds</span>
                <span className="text-2xl font-black text-emerald-400">{h.resources.general_beds}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">O₂ Cylinders</span>
                <span className="text-xl font-black text-cyan-400">{h.resources.oxygen_cylinders}</span>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">Ventilators</span>
                <span className="text-xl font-black text-amber-400">{h.resources.ventilators}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>🚑 Ambulances: <span className="text-white font-bold">{h.resources.ambulances}</span></span>
              <span className="text-emerald-400 font-bold pulse-glow inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
