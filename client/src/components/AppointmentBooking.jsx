import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function AppointmentBooking() {
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [formData, setFormData] = useState({
    patient_name: '', hospital_id: '', doctor_name: 'Dr. Priya Sharma',
    problem_type: 'Sardi Khansi', preferred_time: '', priority_level: 'General'
  });

  const doctors = [
    { name: 'Dr. Priya Sharma', specialty: 'Aam Chikitsak', icon: 'stethoscope' },
    { name: 'Dr. Rajesh Gupta', specialty: 'Hriday Rog Visheshagya', icon: 'cardiology' },
    { name: 'Dr. Anjali Mehta', specialty: 'Naadi Tantrika Visheshagya', icon: 'psychology' },
    { name: 'Dr. Vikram Patel', specialty: 'Bachho Ke Doctor', icon: 'child_care' }
  ];

  useEffect(() => {
    axios.get(`${API_URL}/api/hospitals`).then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setHospitals(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, hospital_id: data[0]._id }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.hospital_id) axios.get(`${API_URL}/api/appointments/doctor-slots/${formData.hospital_id}`).then(res => setDoctorSlots(Array.isArray(res.data) ? res.data : [])).catch(console.error);
  }, [formData.hospital_id]);

  const fetchEstimate = useCallback(async () => {
    if (!formData.hospital_id || !formData.doctor_name) return;
    setEstimateLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/appointments/estimate`, {
        hospital_id: formData.hospital_id, doctor_name: formData.doctor_name,
        preferred_time: formData.preferred_time || new Date().toISOString(),
        priority_level: formData.priority_level, problem_type: formData.problem_type
      });
      setEstimate(res.data);
    } catch (err) { console.error(err); }
    setEstimateLoading(false);
  }, [formData.hospital_id, formData.doctor_name, formData.preferred_time, formData.priority_level, formData.problem_type]);

  useEffect(() => { const t = setTimeout(fetchEstimate, 400); return () => clearTimeout(t); }, [fetchEstimate]);

  const handleBooking = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const res = await axios.post(`${API_URL}/api/appointments`, formData); setBookingConfirmed(res.data); }
    catch (error) { console.error(error); alert('Booking fail ho gayi! Phir se try karein.'); }
    setLoading(false);
  };

  const selectedDoctor = doctors.find(d => d.name === formData.doctor_name);
  const preferredTimeDisplay = (() => {
    if (!formData.preferred_time) return 'ABHI';
    const d = new Date(formData.preferred_time);
    return isNaN(d.getTime()) ? 'ABHI' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  })();

  if (bookingConfirmed) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined neon-text" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          <h2 className="neon-text mt-4" style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: 700 }}>BOOKING_PAKKI_HO_GAYI!</h2>
          <p style={{ color: '#849495', fontFamily: 'Space Grotesk', fontSize: '12px', letterSpacing: '0.1em', marginTop: '4px' }}>AAPKA_TOKEN_BAN_GAYA_HAI</p>
        </div>
        <div className="ticket-shadow">
          <div className="p-6 rounded-t-lg" style={{ background: 'linear-gradient(135deg, rgba(0,219,233,0.15), rgba(188,255,95,0.08))', border: '1px solid rgba(0,219,233,0.25)', borderBottom: 'none' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="neon-label" style={{ fontSize: '10px', color: '#849495' }}>MEDICAL_TOKEN</p>
                <p className="neon-text" style={{ fontSize: '48px', fontFamily: 'Space Grotesk', fontWeight: 700 }}>#{bookingConfirmed.queue_number}</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'rgba(0,219,233,0.15)', fontSize: '48px' }}>confirmation_number</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div><p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>MAREEZ</p><p style={{ color: '#e2e2e8', fontFamily: 'Space Grotesk', fontWeight: 600 }}>{bookingConfirmed.patient_name}</p></div>
              <div className="text-right"><p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>ZAROORAT</p>
                <span className="px-2 py-0.5 rounded" style={{ fontSize: '10px', fontFamily: 'Space Grotesk', fontWeight: 700, background: bookingConfirmed.priority_level === 'Emergency' ? 'rgba(147,0,10,0.4)' : 'rgba(0,219,233,0.1)', color: bookingConfirmed.priority_level === 'Emergency' ? '#ffb4ab' : '#00dbe9' }}>
                  {bookingConfirmed.priority_level === 'Emergency' ? 'ATYAVASTHA' : bookingConfirmed.priority_level === 'Priority' ? 'ZARURI' : 'SAADHARAN'}
                </span>
              </div>
            </div>
          </div>
          <div className="relative flex items-center" style={{ background: '#1e2024' }}>
            <div className="absolute left-0 w-4 h-8 rounded-r-full -ml-2" style={{ background: '#111318' }}></div>
            <div className="flex-1 mx-4" style={{ borderBottom: '2px dashed rgba(0,219,233,0.1)' }}></div>
            <div className="absolute right-0 w-4 h-8 rounded-l-full -mr-2" style={{ background: '#111318' }}></div>
          </div>
          <div className="p-6 rounded-b-lg" style={{ background: '#1e2024', border: '1px solid rgba(0,219,233,0.1)', borderTop: 'none' }}>
            <div className="space-y-3">
              <div className="flex items-center gap-2" style={{ color: '#849495', fontSize: '13px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#00dbe9' }}>person</span>
                <span style={{ fontFamily: 'Space Grotesk' }}>{bookingConfirmed.doctor_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div><p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>ANUMAAN_SAMAY</p>
                  <p style={{ fontSize: '20px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e2e8' }}>{new Date(bookingConfirmed.estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                <div className="text-right"><p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>AAPSE_PEHLE</p><p className="neon-text" style={{ fontSize: '24px', fontFamily: 'Space Grotesk', fontWeight: 700 }}>{bookingConfirmed.queue_number - 1}</p></div>
              </div>
            </div>
            <button onClick={() => { setBookingConfirmed(null); setEstimate(null); }} className="w-full mt-6 py-3 rounded neon-btn flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span> NAYA_APPOINTMENT_BOOK_KAREIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="neon-text flex items-center justify-center gap-3" style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
          SMART_APPOINTMENT_BOOKING
        </h1>
        <p style={{ color: '#849495', fontFamily: 'Space Grotesk', fontSize: '13px', letterSpacing: '0.05em', marginTop: '6px' }}>
          APNA TOKEN AUR SAMAY DEKHEIN — JAISE TRAIN TICKET BOOKING 🚆
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8">
            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="neon-label block mb-2">MAREEZ_KA_NAAM</label>
                  <input type="text" required placeholder="jaise: Amit Verma" className="neon-input" value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})} /></div>
                <div><label className="neon-label block mb-2">HOSPITAL_CHUNEIN</label>
                  <select className="neon-input" style={{ cursor: 'pointer' }} value={formData.hospital_id} onChange={e => setFormData({...formData, hospital_id: e.target.value})}>
                    {hospitals.map(h => <option key={h._id} value={h._id} style={{ background: '#111318' }}>{h.name}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="neon-label block mb-2">DOCTOR_CHUNEIN</label>
                  <select className="neon-input" style={{ cursor: 'pointer' }} value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})}>
                    {doctors.map(d => <option key={d.name} value={d.name} style={{ background: '#111318' }}>{d.name} ({d.specialty})</option>)}
                  </select></div>
                <div><label className="neon-label block mb-2">SAMAY_CHUNEIN</label>
                  <input type="datetime-local" required className="neon-input" value={formData.preferred_time} onChange={e => setFormData({...formData, preferred_time: e.target.value})} /></div>
              </div>
              <div><label className="neon-label block mb-2">BIMARI_YA_SAMASYA</label>
                <textarea required rows="2" placeholder="jaise: Sardi, Bukhar, Sar Dard, Pet Dard" className="neon-input resize-none" style={{ borderBottom: 'none', border: '1px solid rgba(59,73,75,0.4)', borderRadius: '0.25rem', padding: '0.75rem' }} value={formData.problem_type} onChange={e => setFormData({...formData, problem_type: e.target.value})} /></div>
              <div className="flex gap-3 pt-4">
                {[
                  { level: 'General', label: 'SAADHARAN', color: '#00dbe9' },
                  { level: 'Priority', label: 'ZARURI', color: '#bcff5f' },
                  { level: 'Emergency', label: 'ATYAVASTHA', color: '#ffb4ab' }
                ].map(({ level, label, color }) => (
                  <button key={level} type="button" onClick={() => setFormData({...formData, priority_level: level})}
                    className="flex-1 py-3 rounded transition-all" style={{
                      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em',
                      background: formData.priority_level === level ? `${color}15` : 'rgba(30,32,36,0.5)',
                      border: `1px solid ${formData.priority_level === level ? color + '50' : 'rgba(59,73,75,0.3)'}`,
                      color: formData.priority_level === level ? color : '#849495',
                      boxShadow: formData.priority_level === level ? `0 0 15px ${color}20` : 'none'
                    }}>{label}</button>
                ))}
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 rounded neon-btn-solid flex items-center justify-center gap-3 disabled:opacity-50">
                {loading ? <span className="animate-pulse">QUEUE_JAANCH_HO_RAHI_HAI...</span> : <><span>SMART_TOKEN_BANAYEIN</span><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span></>}
              </button>
            </form>
          </div>

          {doctorSlots.length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="neon-label mb-4 flex items-center gap-2" style={{ fontSize: '14px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00dbe9' }}>groups</span>
                DOCTOR_QUEUE_STHITI
                <span className="pulse-glow inline-block ml-2" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00dbe9' }}></span>
                <span style={{ fontSize: '10px', color: '#bcff5f' }}>LIVE</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctorSlots.map(slot => {
                  const doc = doctors.find(d => d.name === slot.doctor_name);
                  const isSelected = formData.doctor_name === slot.doctor_name;
                  return (
                    <button key={slot.doctor_name} type="button" onClick={() => setFormData({...formData, doctor_name: slot.doctor_name})}
                      className="p-4 rounded text-left transition-all" style={{
                        background: isSelected ? 'rgba(0,219,233,0.06)' : 'rgba(30,32,36,0.4)',
                        border: `1px solid ${isSelected ? 'rgba(0,219,233,0.3)' : 'rgba(59,73,75,0.2)'}`,
                        boxShadow: isSelected ? '0 0 15px rgba(0,219,233,0.08)' : 'none'
                      }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '13px', color: '#e2e2e8' }}>
                          <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '16px', color: '#00dbe9' }}>{doc?.icon}</span>
                          {slot.doctor_name}
                        </span>
                        <span className="px-2 py-0.5 rounded" style={{ fontSize: '9px', fontFamily: 'Space Grotesk', fontWeight: 700,
                          background: slot.patients_waiting === 0 ? 'rgba(188,255,95,0.1)' : 'rgba(255,180,171,0.1)',
                          color: slot.patients_waiting === 0 ? '#bcff5f' : '#ffb4ab',
                          border: `1px solid ${slot.patients_waiting === 0 ? 'rgba(188,255,95,0.15)' : 'rgba(255,180,171,0.15)'}`
                        }}>{slot.patients_waiting === 0 ? 'UPALABDH' : `${slot.patients_waiting} INTEZAAR`}</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ fontSize: '11px', color: '#3b494b', fontFamily: 'Space Grotesk' }}>
                        <span>AGLA_TOKEN: <span style={{ color: '#e2e2e8', fontWeight: 700 }}>#{slot.next_token}</span></span>
                        <span>MILEGA: <span style={{ color: '#bcff5f', fontWeight: 700 }}>{slot.next_available}</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel overflow-hidden" style={{ borderColor: 'rgba(0,219,233,0.2)' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(0,219,233,0.05)', borderBottom: '1px solid rgba(0,219,233,0.1)' }}>
              <h3 className="neon-label flex items-center gap-2" style={{ fontSize: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>confirmation_number</span>
                LIVE_TOKEN_JHAANKI
              </h3>
              {estimateLoading && <span className="pulse-glow inline-block" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00dbe9' }}></span>}
            </div>
            {estimate ? (
              <div className="p-5 space-y-4">
                <div className="p-4 rounded relative overflow-hidden" style={{ background: 'rgba(12,14,18,0.8)', border: '1px solid rgba(59,73,75,0.3)' }}>
                  <p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.1em' }}>AAPKA_TOKEN_HOGA</p>
                  <p className="neon-text" style={{ fontSize: '40px', fontFamily: 'Space Grotesk', fontWeight: 700 }}>#{estimate.queue_number}</p>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between"><span style={{ fontSize: '11px', color: '#3b494b', fontFamily: 'Space Grotesk' }}>BOOKING_SAMAY</span><span style={{ fontSize: '13px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e2e8' }}>{preferredTimeDisplay}</span></div>
                    <div className="flex items-center gap-2"><div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(0,219,233,0.3), rgba(188,255,95,0.3))' }}></div><span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#bcff5f' }}>arrow_forward</span><div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(188,255,95,0.3), transparent)' }}></div></div>
                    <div className="flex justify-between"><span style={{ fontSize: '11px', color: '#3b494b', fontFamily: 'Space Grotesk' }}>NUMBER_AAYEGA</span><span style={{ fontSize: '13px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#bcff5f' }}>{estimate.estimated_time_formatted}</span></div>
                  </div>
                  <div className="mt-3 pt-3 flex justify-between" style={{ borderTop: '1px dashed rgba(59,73,75,0.3)' }}>
                    <div><p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>PEHLE_HAIN</p><p style={{ fontSize: '18px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e2e8' }}>{estimate.patients_ahead}</p></div>
                    <div className="text-right"><p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>INTEZAAR</p><p style={{ fontSize: '18px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#e2e2e8' }}>{estimate.wait_minutes} min</p></div>
                  </div>
                </div>
                <div className="p-3 rounded" style={{ background: 'rgba(188,255,95,0.04)', border: '1px solid rgba(188,255,95,0.12)' }}>
                  <p style={{ fontSize: '12px', color: '#849495', lineHeight: 1.6 }}>
                    <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '14px', color: '#bcff5f' }}>auto_awesome</span>
                    <span style={{ color: '#e2e2e8', fontWeight: 600 }}>{selectedDoctor?.name}</span> se <span className="neon-text" style={{ fontWeight: 700 }}>{preferredTimeDisplay}</span> pe book karne pe <span style={{ color: '#e2e2e8', fontWeight: 600 }}>{formData.problem_type}</span> ka token <span style={{ color: '#bcff5f', fontWeight: 700 }}>#{estimate.queue_number}</span> milega, aapka number <span style={{ color: '#bcff5f', fontWeight: 700 }}>~{estimate.estimated_time_formatted}</span> tak aa jayega.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center"><span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#3b494b' }}>schedule</span><p style={{ color: '#3b494b', fontFamily: 'Space Grotesk', fontSize: '12px', marginTop: '8px' }}>DOCTOR_AUR_SAMAY_CHUNEIN</p></div>
            )}
          </div>

          {estimate?.ai_recommendation && (
            <div className="glass-panel p-5" style={{ borderColor: 'rgba(188,255,95,0.15)' }}>
              <h3 className="neon-label mb-3 flex items-center gap-2" style={{ fontSize: '12px', color: '#bcff5f' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>smart_toy</span>AI_SALAH</h3>
              <div className="p-3 rounded" style={{ background: 'rgba(12,14,18,0.6)', border: '1px solid rgba(59,73,75,0.2)' }}>
                <p style={{ fontSize: '10px', color: '#3b494b', fontFamily: 'Space Grotesk', fontWeight: 700 }}>SAHI_SAMAY</p>
                <p style={{ fontSize: '18px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#bcff5f' }}>{estimate.ai_recommendation.recommended_time}</p>
                <p style={{ fontSize: '11px', color: '#849495', marginTop: '4px' }}>{estimate.ai_recommendation.reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
