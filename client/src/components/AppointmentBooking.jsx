import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Ticket, Calendar, Clock, User, ClipboardList, Zap, ArrowRight, CheckCircle2, Train, Users, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AppointmentBooking() {
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [formData, setFormData] = useState({
    patient_name: '',
    hospital_id: '',
    doctor_name: 'Dr. Priya Sharma',
    problem_type: 'Sardi Khansi (Common Cold)',
    preferred_time: '',
    priority_level: 'General'
  });

  const doctors = [
    { name: 'Dr. Priya Sharma', specialty: 'General Physician', icon: '🩺' },
    { name: 'Dr. Rajesh Gupta', specialty: 'Cardiologist', icon: '❤️' },
    { name: 'Dr. Anjali Mehta', specialty: 'Neurologist', icon: '🧠' },
    { name: 'Dr. Vikram Patel', specialty: 'Pediatrician', icon: '👶' }
  ];

  // Load hospitals on mount
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

  // Fetch doctor slots whenever hospital changes
  useEffect(() => {
    if (formData.hospital_id) {
      axios.get(`${API_URL}/api/appointments/doctor-slots/${formData.hospital_id}`)
        .then(res => setDoctorSlots(res.data))
        .catch(err => console.error(err));
    }
  }, [formData.hospital_id]);

  // Debounced estimate fetch
  const fetchEstimate = useCallback(async () => {
    if (!formData.hospital_id || !formData.doctor_name) return;
    
    setEstimateLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/appointments/estimate`, {
        hospital_id: formData.hospital_id,
        doctor_name: formData.doctor_name,
        preferred_time: formData.preferred_time || new Date().toISOString(),
        priority_level: formData.priority_level,
        problem_type: formData.problem_type
      });
      setEstimate(res.data);
    } catch (err) {
      console.error(err);
    }
    setEstimateLoading(false);
  }, [formData.hospital_id, formData.doctor_name, formData.preferred_time, formData.priority_level, formData.problem_type]);

  useEffect(() => {
    const timer = setTimeout(fetchEstimate, 400);
    return () => clearTimeout(timer);
  }, [fetchEstimate]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/appointments`, formData);
      setBookingConfirmed(res.data);
    } catch (error) {
      console.error(error);
      alert('Booking failed! Please try again.');
    }
    setLoading(false);
  };

  const selectedDoctor = doctors.find(d => d.name === formData.doctor_name);
  const selectedHospital = hospitals.find(h => h._id === formData.hospital_id);
  const preferredTimeDisplay = (() => {
    if (!formData.preferred_time) return 'Abhi';
    const d = new Date(formData.preferred_time);
    return isNaN(d.getTime()) ? 'Abhi' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  })();

  // ===== CONFIRMED BOOKING — TICKET VIEW =====
  if (bookingConfirmed) {
    return (
      <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4 animate-pulse">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white">Booking Confirmed! ✅</h2>
          <p className="text-slate-400 mt-2">Aapka smart queue token generate ho gaya hai.</p>
        </div>

        {/* Train-ticket style UI */}
        <div className="relative group ticket-shadow">
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 p-6 rounded-t-3xl border-x border-t border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100/70 text-xs font-bold uppercase tracking-widest">🏥 Medical Token</p>
                <p className="text-white text-4xl font-black mt-1">#{bookingConfirmed.queue_number}</p>
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

          <div className="relative flex items-center bg-slate-800">
            <div className="absolute left-0 w-4 h-8 bg-slate-900 rounded-r-full -ml-2"></div>
            <div className="flex-1 border-b-2 border-dashed border-white/10 mx-4"></div>
            <div className="absolute right-0 w-4 h-8 bg-slate-900 rounded-l-full -mr-2"></div>
          </div>

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
                    <span className="text-xs text-slate-500 uppercase font-bold">Anumaan Samay</span>
                    <span className="text-lg font-bold text-white">
                      {new Date(bookingConfirmed.estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Aapse Pehle</p>
                  <p className="text-2xl font-bold text-cyan-400">{bookingConfirmed.queue_number - 1}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { setBookingConfirmed(null); setEstimate(null); }}
              className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition font-semibold"
            >
              🔄 Naya Appointment Book Karein
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== BOOKING FORM VIEW =====
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center space-x-3">
          <Calendar className="text-cyan-400 w-8 h-8" />
          <span>🏥 Smart Appointment Booking</span>
        </h1>
        <p className="text-slate-400 mt-2">Apna predicted token aur estimated time dekhein — jaise train ticket booking 🚆</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== LEFT: BOOKING FORM ===== */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8">
            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Patient Ka Naam</label>
                  <input 
                    type="text" required placeholder="e.g. Rahul Kumar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition placeholder:text-slate-600"
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
                  <label className="text-sm font-medium text-slate-400">Doctor Chunein</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})}
                  >
                    {doctors.map(d => <option key={d.name} value={d.name}>{d.icon} {d.name} ({d.specialty})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Samay Chunein</label>
                  <input 
                    type="datetime-local" required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                    value={formData.preferred_time} onChange={e => setFormData({...formData, preferred_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Bimari / Samasya</label>
                <textarea 
                  required rows="2" placeholder="e.g. Sardi, Bukhar, Sar Dard"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition placeholder:text-slate-600"
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
                    {level === 'General' ? '🟢 Saadharan' : level === 'Priority' ? '🟡 Priority' : '🔴 Emergency'}
                  </button>
                ))}
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 text-lg"
              >
                {loading ? <span className="animate-pulse">Queue Analyze Ho Raha Hai...</span> : <><span>🎫 Smart Token Generate Karein</span><ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          </div>

          {/* ===== DOCTOR AVAILABILITY TABLE ===== */}
          {doctorSlots.length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
                <Users className="text-cyan-400 w-5 h-5" />
                <span>Doctor Queue Status</span>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full ml-2 animate-pulse">LIVE</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctorSlots.map(slot => {
                  const doc = doctors.find(d => d.name === slot.doctor_name);
                  const isSelected = formData.doctor_name === slot.doctor_name;
                  return (
                    <button
                      key={slot.doctor_name}
                      type="button"
                      onClick={() => setFormData({...formData, doctor_name: slot.doctor_name})}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30' 
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white text-sm">{doc?.icon} {slot.doctor_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          slot.patients_waiting === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                          slot.patients_waiting <= 2 ? 'bg-amber-400/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {slot.patients_waiting === 0 ? 'Upalabdh' : `${slot.patients_waiting} intezaar`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Agla Token: <span className="text-white font-bold">#{slot.next_token}</span></span>
                        <span>Upalabdh: <span className="text-emerald-400 font-bold">{slot.next_available}</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT SIDEBAR: LIVE ESTIMATION PREVIEW ===== */}
        <div className="space-y-6">
          {/* Live Token Preview */}
          <div className="glass-panel p-0 overflow-hidden border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-transparent">
            <div className="bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Train className="text-cyan-400 w-4 h-4" />
                <span>🎫 Live Token Preview</span>
              </h3>
              {estimateLoading && <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>}
            </div>
            
            {estimate ? (
              <div className="p-5 space-y-4">
                {/* Mini ticket preview */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full"></div>
                  
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Aapka Token Hoga</p>
                  <p className="text-4xl font-black text-cyan-400 mb-3">#{estimate.queue_number}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Booking at</span>
                      <span className="text-sm font-bold text-white">{preferredTimeDisplay}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-emerald-500/50"></div>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Number Aayega</span>
                      <span className="text-sm font-black text-emerald-400">{estimate.estimated_time_formatted}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dashed border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Pehle Hain</p>
                      <p className="text-lg font-black text-white">{estimate.patients_ahead}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Wait Time</p>
                      <p className="text-lg font-black text-white">{estimate.wait_minutes} min</p>
                    </div>
                  </div>
                </div>

                {/* Hindi sentence summary */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
                    <span className="text-white font-semibold">{selectedDoctor?.name}</span> se{' '}
                    <span className="text-cyan-400 font-bold">{preferredTimeDisplay}</span> pe book karne pe{' '}
                    <span className="text-white font-semibold">{formData.problem_type}</span> ka token{' '}
                    <span className="text-emerald-400 font-black">#{estimate.queue_number}</span>{' '}
                    milega, aapka number{' '}
                    <span className="text-emerald-400 font-black">~{estimate.estimated_time_formatted}</span>{' '}
                    tak aa jayega.
                  </p>
                </div>

                {/* Queue preview */}
                {estimate.queue_preview && estimate.queue_preview.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Aapke Aage Line Mein</p>
                    <div className="space-y-1.5">
                      {estimate.queue_preview.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                          <div className="flex items-center space-x-2">
                            <span className="text-cyan-400 font-black">#{p.position}</span>
                            <span className="text-slate-400 truncate max-w-[100px]">{p.patient_name}</span>
                          </div>
                          <span className="text-slate-500">{p.estimated_time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 text-center text-slate-500 text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>Doctor aur samay chunein to live token preview dikhai dega</p>
              </div>
            )}
          </div>

          {/* AI Recommendation */}
          {estimate?.ai_recommendation && (
            <div className="glass-panel p-5 border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
                <Zap className="text-emerald-400 w-4 h-4" />
                <span>🤖 AI Recommendation</span>
              </h3>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Sahi Samay</p>
                    <p className="text-lg font-black text-emerald-400 mb-1">{estimate.ai_recommendation.recommended_time}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{estimate.ai_recommendation.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
              <ClipboardList className="text-cyan-400 w-4 h-4" />
              <span>Kaise Kaam Karta Hai</span>
            </h3>
            <ul className="text-xs text-slate-400 space-y-2.5">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold mt-0.5">1.</span>
                <span>Doctor aur samay chunein — <strong className="text-white">predicted token</strong> turant dikhega.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold mt-0.5">2.</span>
                <span>Token preview mein <strong className="text-white">exact estimated time</strong> dikhta hai jaise train PNR status.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold mt-0.5">3.</span>
                <span><strong className="text-red-400">Emergency</strong> cases ka number sabse pehle aata hai.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold mt-0.5">4.</span>
                <span>Live Queue page pe apna <strong className="text-white">position track</strong> karein.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
