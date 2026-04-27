import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PatientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', age: 0, symptoms: '', symptoms_severity: 50, oxygen_level: 95, comorbidities: 0, lat: 28.6139, lng: 77.2090
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
      
      // Safety check for mixed content
      if (window.location.protocol === 'https:' && API_URL.startsWith('http://localhost')) {
        console.warn('Backend URL is localhost but site is HTTPS. This request will likely fail due to Mixed Content.');
      }

      await axios.post(`${API_URL}/api/patients`, { 
        ...formData, 
        location: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } 
      });
      navigate('/');
    } catch (error) { 
      console.error(error); 
      const msg = error.response?.data?.message || error.message;
      alert(`Galti ho gayi! Error: ${msg}`); 
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="neon-text flex items-center justify-center gap-3" style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
          MAREEZ_DAKHILA
        </h1>
        <p style={{ color: '#849495', fontFamily: 'Space Grotesk', fontSize: '13px', letterSpacing: '0.05em', marginTop: '6px' }}>
          AI ENGINE VITALS ANALYZE KARKE SABSE SAHI HOSPITAL ALLOCATE KAREGA
        </p>
      </header>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="neon-label block mb-2">MAREEZ_KA_NAAM</label>
              <input type="text" required placeholder="jaise: Rajesh Kumar" className="neon-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="neon-label flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
                UMRA
              </label>
              <input type="number" required min="0" max="120" placeholder="jaise: 45" className="neon-input" value={formData.age === 0 ? '' : formData.age} onChange={e => setFormData({...formData, age: e.target.value ? parseInt(e.target.value) : 0})} />
            </div>
          </div>

          <div>
            <label className="neon-label block mb-2">LAKSHAN_VIVARAN</label>
            <textarea required rows="3" placeholder="Lakshan batayein — jaise: Tez bukhar, khansi, sans lene mein taklif, seene mein dard" className="neon-input resize-none"
              style={{ borderBottom: 'none', border: '1px solid rgba(59,73,75,0.4)', borderRadius: '0.25rem', padding: '0.75rem' }}
              value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6" style={{ borderTop: '1px solid rgba(59,73,75,0.2)' }}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="neon-label flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ffb4ab' }}>warning</span>
                  GAMBHIRTA_STAR
                </label>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '18px', color: formData.symptoms_severity > 70 ? '#ffb4ab' : '#00dbe9' }}>{formData.symptoms_severity}</span>
              </div>
              <input type="range" min="0" max="100" className="w-full" style={{ accentColor: '#00dbe9' }} value={formData.symptoms_severity} onChange={e => setFormData({...formData, symptoms_severity: parseInt(e.target.value)})} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="neon-label">OXYGEN_STAR_(SPO2)</label>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '18px', color: formData.oxygen_level < 90 ? '#ffb4ab' : '#bcff5f' }}>{formData.oxygen_level}%</span>
              </div>
              <input type="range" min="50" max="100" className="w-full" style={{ accentColor: '#bcff5f' }} value={formData.oxygen_level} onChange={e => setFormData({...formData, oxygen_level: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="pt-6" style={{ borderTop: '1px solid rgba(59,73,75,0.2)' }}>
            <label className="neon-label block mb-4">PURANI_BIMARI_STAR</label>
            <div className="flex gap-4">
              {[
                { level: 0, label: 'KUCH_NAHI', color: '#00dbe9' },
                { level: 1, label: 'HALKA', color: '#bcff5f' },
                { level: 2, label: 'GAMBHIR', color: '#ffb4ab' }
              ].map(({ level, label, color }) => (
                <label key={level} className={`flex-1 cursor-pointer rounded p-4 text-center transition-all ${formData.comorbidities === level ? 'neon-glow' : ''}`}
                  style={{
                    background: formData.comorbidities === level ? `${color}12` : 'rgba(30,32,36,0.4)',
                    border: `1px solid ${formData.comorbidities === level ? color + '60' : 'rgba(59,73,75,0.3)'}`,
                    color: formData.comorbidities === level ? color : '#849495'
                  }}>
                  <input type="radio" className="hidden" name="comorbidities" checked={formData.comorbidities === level} onChange={() => setFormData({...formData, comorbidities: level})} />
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading} className="w-full py-4 rounded neon-btn-solid flex justify-center items-center gap-3 disabled:opacity-50">
              {loading ? <span className="animate-pulse" style={{ fontFamily: 'Space Grotesk' }}>AI_SE_JAANCH_HO_RAHI_HAI...</span> : <>
                <span>JAANCH_KAREIN_AUR_HOSPITAL_DIJIYE</span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
              </>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
