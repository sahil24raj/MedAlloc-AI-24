import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Calendar, Clock, User, ClipboardList, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AppointmentBooking() {
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [formData, setFormData] = useState({
    patient_name: '',
    hospital_id: '',
    doctor_name: 'Dr. Sarah Wilson',
    problem_type: 'General Checkup',
    preferred_time: '',
    priority_level: 'General'
  });

  const doctors = [
    { name: 'Dr. Sarah Wilson', specialty: 'General Physician' },
    { name: 'Dr. James Miller', specialty: 'Cardiologist' },
    { name: 'Dr. Elena Rodriguez', specialty: 'Neurologist' },
    { name: 'Dr. David Chen', specialty: 'Pediatrician' }
  ];

  useEffect(() => {
    axios.get(`${API_URL}/api/hospitals`)
      .then(res => {
        setHospitals(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, hospital_id: res.data[0]._id }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/appointments`, formData);
      setBookingConfirmed(res.data);
    } catch (error) {
      console.error(error);
      alert('Booking failed');
    }
    setLoading(false);
  };

  if (bookingConfirmed) {
    return (
      <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white">Booking Confirmed!</h2>
          <p className="text-slate-400 mt-2">Your smart queue token has been generated.</p>
        </div>

        {/* Train-ticket style UI */}
        <div className="relative group">
          {/* Top part */}
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 p-6 rounded-t-3xl border-x border-t border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100/70 text-xs font-bold uppercase tracking-widest">Medical Token</p>
                <p className="text-white text-3xl font-black mt-1">#{bookingConfirmed.queue_number}</p>
              </div>
              <div className="text-right">
                <Ticket className="text-white/30 w-12 h-12" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-emerald-100/50 text-[10px] uppercase font-bold">Patient</p>
                <p className="text-white font-semibold truncate">{bookingConfirmed.patient_name}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100/50 text-[10px] uppercase font-bold">Priority</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  bookingConfirmed.priority_level === 'Emergency' ? 'bg-red-500 text-white' : 
                  bookingConfirmed.priority_level === 'Priority' ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'
                }`}>
                  {bookingConfirmed.priority_level}
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative flex items-center bg-slate-800">
            <div className="absolute left-0 w-4 h-8 bg-slate-900 rounded-r-full -ml-2"></div>
            <div className="flex-1 border-b-2 border-dashed border-white/10 mx-4"></div>
            <div className="absolute right-0 w-4 h-8 bg-slate-900 rounded-l-full -mr-2"></div>
          </div>

          {/* Bottom part */}
          <div className="bg-slate-800 p-6 rounded-b-3xl border-x border-b border-white/10">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-slate-300">
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">{bookingConfirmed.doctor_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-bold">Est. Consultation</span>
                    <span className="text-lg font-bold text-white">
                      {new Date(bookingConfirmed.estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Wait Pos</p>
                  <p className="text-2xl font-bold text-cyan-400">{bookingConfirmed.queue_number - 1}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setBookingConfirmed(null)}
              className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition font-semibold"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center space-x-3">
          <Calendar className="text-cyan-400 w-8 h-8" />
          <span>Smart Appointment Booking</span>
        </h1>
        <p className="text-slate-400 mt-2">Predicted wait times powered by MedAlloc AI Engine</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8">
            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Patient Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Hospital</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={formData.hospital_id} onChange={e => setFormData({...formData, hospital_id: e.target.value})}
                  >
                    {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Preferred Doctor</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})}
                  >
                    {doctors.map(d => <option key={d.name} value={d.name}>{d.name} ({d.specialty})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Preferred Time</label>
                  <input 
                    type="datetime-local" required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={formData.preferred_time} onChange={e => setFormData({...formData, preferred_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Problem Description</label>
                <textarea 
                  required rows="3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  value={formData.problem_type} onChange={e => setFormData({...formData, problem_type: e.target.value})}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                {['General', 'Priority', 'Emergency'].map(level => (
                  <button 
                    key={level} type="button"
                    onClick={() => setFormData({...formData, priority_level: level})}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      formData.priority_level === level 
                      ? (level === 'Emergency' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                         level === 'Priority' ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20' : 
                         'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20')
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 text-lg"
              >
                {loading ? <span className="animate-pulse">Analyzing Queue...</span> : <><span>Generate Smart Token</span><ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 border-cyan-500/20 bg-cyan-500/5">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
              <Zap className="text-cyan-400 w-5 h-5" />
              <span>AI Insights</span>
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Queue Status</p>
                <p className="text-sm text-slate-300">Average wait time is currently <span className="text-emerald-400 font-bold">12 mins</span>. Optimal booking time detected.</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">No-Show Prediction</p>
                <p className="text-sm text-slate-300">Based on priority level, show-up probability is <span className="text-cyan-400 font-bold">98%</span>.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
              <ClipboardList className="text-emerald-400 w-5 h-5" />
              <span>Booking Tips</span>
            </h3>
            <ul className="text-sm text-slate-400 space-y-3">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Select <strong>Emergency</strong> for life-threatening conditions.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Wait times are dynamic and update in real-time.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Bring your token number for verification.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
