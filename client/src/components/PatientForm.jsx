import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Send, AlertTriangle } from 'lucide-react';

export default function PatientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    symptoms: '',
    symptoms_severity: 50,
    oxygen_level: 95,
    comorbidities: 0,
    lat: 40.7128,
    lng: -74.0060
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/patients`, {
        ...formData,
        location: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }
      });
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error submitting patient data');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center space-x-3">
          <Stethoscope className="text-cyan-400 w-8 h-8" />
          <span>New Patient Intake</span>
        </h1>
        <p className="text-slate-400 mt-2">AI will automatically analyze vitals and allocate the optimal hospital resources.</p>
      </header>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Patient Name</label>
              <input 
                type="text" required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
              <input 
                type="number" required min="0" max="120"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symptoms Description</label>
            <textarea 
              required rows="3"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition resize-none"
              value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-700/50">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Symptom Severity (0-100)</span>
                </label>
                <span className="text-emerald-400 font-bold">{formData.symptoms_severity}</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                className="w-full accent-emerald-500"
                value={formData.symptoms_severity} onChange={e => setFormData({...formData, symptoms_severity: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-300">Blood Oxygen (SpO2 %)</label>
                <span className={`font-bold ${formData.oxygen_level < 90 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formData.oxygen_level}%
                </span>
              </div>
              <input 
                type="range" min="50" max="100" 
                className="w-full accent-cyan-500"
                value={formData.oxygen_level} onChange={e => setFormData({...formData, oxygen_level: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <label className="block text-sm font-medium text-slate-300 mb-4">Pre-existing Comorbidities</label>
            <div className="flex space-x-4">
              {[0, 1, 2].map((level) => (
                <label key={level} className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition ${
                  formData.comorbidities === level 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                    : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-500'
                }`}>
                  <input 
                    type="radio" className="hidden" name="comorbidities"
                    checked={formData.comorbidities === level} 
                    onChange={() => setFormData({...formData, comorbidities: level})}
                  />
                  <span className="font-semibold block">{level === 0 ? 'None' : level === 1 ? 'Mild' : 'Severe'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex justify-center items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">Processing via AI Engine...</span>
              ) : (
                <>
                  <span>Evaluate & Allocate Resource</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
