const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db } = require('../firebase');

// Utility to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = function(io) {
  // Test route for Vercel POST check
  router.post('/test', (req, res) => {
    res.json({ message: "POST Success!", data: req.body });
  });

  // Get all hospitals
  router.get('/hospitals', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const snapshot = await db.collection('hospitals').get();
      const hospitals = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      res.json(hospitals);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get all patients
  router.get('/patients', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const snapshot = await db.collection('patients').orderBy('createdAt', 'desc').get();
      const patients = [];
      
      for (const doc of snapshot.docs) {
        const patientData = { _id: doc.id, ...doc.data() };
        if (patientData.allocated_hospital) {
          const hospDoc = await db.collection('hospitals').doc(patientData.allocated_hospital).get();
          if (hospDoc.exists) {
            patientData.allocated_hospital = { _id: hospDoc.id, ...hospDoc.data() };
          }
        }
        patients.push(patientData);
      }
      
      res.json(patients);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Add a new patient and allocate hospital
  router.post('/patients', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const { name, age, symptoms, symptoms_severity, oxygen_level, comorbidities, location } = req.body;

      let priority_score = 50;
      let priority_label = "Medium";
      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
      
      try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
          age: parseInt(age) || 30,
          oxygen_level: parseInt(oxygen_level) || 95,
          symptoms_severity: parseInt(symptoms_severity) || 50,
          comorbidities: parseInt(comorbidities) || 0
        }, { timeout: 3000 });
        
        priority_score = mlResponse.data.priority_score;
        priority_label = mlResponse.data.priority_label;
      } catch (mlErr) {
        console.error("ML Service error (fallback used):", mlErr.message);
      }

      const hospSnapshot = await db.collection('hospitals').get();
      const hospitals = hospSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      
      let nearestHospital = null;
      let minDistance = Infinity;

      for (let h of hospitals) {
        const patientLat = location?.lat || 28.6139;
        const patientLng = location?.lng || 77.2090;
        
        const dist = getDistanceFromLatLonInKm(patientLat, patientLng, h.location.lat, h.location.lng);
        let canAccept = false;
        if (priority_label === 'High') {
          if (h.resources.icu_beds > 0 && h.resources.ventilators > 0) canAccept = true;
        } else {
          if (h.resources.general_beds > 0) canAccept = true;
        }

        if (canAccept && dist < minDistance) {
          minDistance = dist;
          nearestHospital = h;
        }
      }

      const newPatientData = {
        name, age, symptoms, symptoms_severity, oxygen_level, comorbidities, location,
        priority_score, priority_label,
        allocated_hospital: nearestHospital ? nearestHospital._id : null,
        status: nearestHospital ? 'Allocated' : 'Pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('patients').add(newPatientData);
      const newPatient = { _id: docRef.id, ...newPatientData };

      if (nearestHospital) {
        const hospRef = db.collection('hospitals').doc(nearestHospital._id);
        if (priority_label === 'High') {
          nearestHospital.resources.icu_beds -= 1;
          nearestHospital.resources.ventilators -= 1;
        } else {
          nearestHospital.resources.general_beds -= 1;
        }
        await hospRef.update({ resources: nearestHospital.resources });
        io.emit('resource_update', { hospital: { _id: nearestHospital._id, ...nearestHospital } });
      }

      io.emit('new_patient', { patient: newPatient });
      if (priority_label === 'High' && !nearestHospital) {
        io.emit('alert', { message: `CRITICAL: No beds available for high priority patient ${name}!` });
      }

      if (newPatient.allocated_hospital) {
        const hospDoc = await db.collection('hospitals').doc(newPatient.allocated_hospital).get();
        newPatient.allocated_hospital = { _id: hospDoc.id, ...hospDoc.data() };
      }

      res.status(201).json(newPatient);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // --- Appointment Booking Routes ---

  router.post('/appointments/estimate', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const { hospital_id, doctor_name, preferred_time, priority_level } = req.body;

      const snapshot = await db.collection('appointments')
        .where('hospital_id', '==', hospital_id)
        .where('doctor_name', '==', doctor_name)
        .where('status', '==', 'Waiting')
        .orderBy('queue_number', 'asc')
        .get();

      const doctorQueue = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      const patientsAhead = doctorQueue.length;
      const avg_consultation_time = 20;

      const queue_number = patientsAhead + 1;
      let preferredDate = preferred_time ? new Date(preferred_time) : new Date();
      if (isNaN(preferredDate.getTime())) preferredDate = new Date();
      
      const startFrom = preferredDate > new Date() ? preferredDate : new Date();
      const waitMinutes = patientsAhead * avg_consultation_time;
      const estimated_time = new Date(startFrom.getTime() + waitMinutes * 60000);

      const queuePreview = doctorQueue.map((a, i) => ({
        position: i + 1,
        patient_name: a.patient_name,
        problem_type: a.problem_type,
        estimated_time: new Date(startFrom.getTime() + i * avg_consultation_time * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      // Basic AI Fallback
      const hour = preferredDate.getHours();
      let ai_recommendation = { recommended_time: `${hour}:30`, reason: 'Current slot looks optimal. Low patient density detected.' };
      if (hour < 10) {
        ai_recommendation = { recommended_time: '10:00', reason: 'Morning slots (10-12 AM) have the shortest wait times for this doctor.' };
      } else if (hour >= 12 && hour < 14) {
        ai_recommendation = { recommended_time: '14:30', reason: 'Post-lunch slots have fewer patients in queue. Avoid 12-2 PM rush.' };
      }

      res.json({
        queue_number,
        patients_ahead: patientsAhead,
        estimated_time: estimated_time.toISOString(),
        estimated_time_formatted: estimated_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        wait_minutes: waitMinutes,
        avg_consultation_time,
        queue_preview: queuePreview,
        ai_recommendation,
        preferred_time_formatted: preferredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/appointments/doctor-slots/:hospital_id', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const allDoctors = ['Dr. Priya Sharma', 'Dr. Rajesh Gupta', 'Dr. Anjali Mehta', 'Dr. Vikram Patel'];
      const slots = [];

      for (const doctor of allDoctors) {
        const snapshot = await db.collection('appointments')
          .where('hospital_id', '==', req.params.hospital_id)
          .where('doctor_name', '==', doctor)
          .where('status', '==', 'Waiting')
          .get();
        
        const count = snapshot.size;
        const waitMins = count * 20;
        const estTime = new Date(Date.now() + waitMins * 60000);
        slots.push({
          doctor_name: doctor,
          patients_waiting: count,
          next_token: count + 1,
          estimated_wait_minutes: waitMins,
          next_available: estTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      res.json(slots);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  router.post('/appointments', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const { patient_name, hospital_id, doctor_name, problem_type, preferred_time, priority_level } = req.body;

      const snapshot = await db.collection('appointments')
        .where('hospital_id', '==', hospital_id)
        .where('status', '==', 'Waiting')
        .get();

      const queue_number = snapshot.size + 1;
      const waitTime = snapshot.size * 20;
      const estimated_time = new Date(Date.now() + waitTime * 60000);

      const appointmentData = {
        patient_name,
        hospital_id,
        doctor_name,
        problem_type,
        preferred_time: (preferred_time && !isNaN(new Date(preferred_time).getTime())) ? new Date(preferred_time).toISOString() : new Date().toISOString(),
        queue_number,
        estimated_time: estimated_time.toISOString(),
        priority_level: priority_level || 'General',
        status: 'Waiting',
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('appointments').add(appointmentData);
      const appointment = { _id: docRef.id, ...appointmentData };

      io.emit('appointment_new', { appointment });
      res.status(201).json(appointment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/appointments/queue/:hospital_id', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const snapshot = await db.collection('appointments')
        .where('hospital_id', '==', req.params.hospital_id)
        .where('status', '==', 'Waiting')
        .orderBy('queue_number', 'asc')
        .get();
      
      const appointments = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  router.put('/appointments/:id/status', async (req, res) => {
    try {
      if (!db) throw new Error("Database not initialized");
      const { status } = req.body;
      const docRef = db.collection('appointments').doc(req.params.id);
      const doc = await docRef.get();
      
      if (!doc.exists) return res.status(404).json({ message: 'Appointment not found' });

      await docRef.update({ status });
      const updatedAppointment = { _id: doc.id, ...doc.data(), status };

      io.emit('appointment_update', { appointment: updatedAppointment });
      res.json(updatedAppointment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
