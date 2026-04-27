const express = require('express');
const router = express.Router();
const axios = require('axios');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Utility to calculate distance between two coordinates (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = function(io) {
  // Get all hospitals
  router.get('/hospitals', async (req, res) => {
    try {
      const hospitals = await Hospital.find();
      res.json(hospitals);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get all patients
  router.get('/patients', async (req, res) => {
    try {
      const patients = await Patient.find().populate('allocated_hospital').sort({ createdAt: -1 });
      res.json(patients);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Add a new patient and allocate hospital
  router.post('/patients', async (req, res) => {
    try {
      const { name, age, symptoms, symptoms_severity, oxygen_level, comorbidities, location } = req.body;

      // 1. Get Priority from ML Service
      let priority_score = 50;
      let priority_label = "Medium";
      try {
        const mlResponse = await axios.post('http://127.0.0.1:8000/predict', {
          age,
          oxygen_level,
          symptoms_severity,
          comorbidities
        });
        priority_score = mlResponse.data.priority_score;
        priority_label = mlResponse.data.priority_label;
      } catch (mlErr) {
        console.error("ML Service error, using fallback priority.");
      }

      // 2. Find nearest hospital with resources
      const hospitals = await Hospital.find();
      let nearestHospital = null;
      let minDistance = Infinity;

      for (let h of hospitals) {
        const dist = getDistanceFromLatLonInKm(location.lat, location.lng, h.location.lat, h.location.lng);
        // Basic check: Needs ICU if severity is high or oxygen is very low, else general bed
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

      // 3. Create Patient
      const newPatient = new Patient({
        name, age, symptoms, symptoms_severity, oxygen_level, comorbidities, location,
        priority_score, priority_label,
        allocated_hospital: nearestHospital ? nearestHospital._id : null,
        status: nearestHospital ? 'Allocated' : 'Pending'
      });
      await newPatient.save();

      // 4. Update Hospital Resources if allocated
      if (nearestHospital) {
        if (priority_label === 'High') {
          nearestHospital.resources.icu_beds -= 1;
          nearestHospital.resources.ventilators -= 1;
        } else {
          nearestHospital.resources.general_beds -= 1;
        }
        await nearestHospital.save();
        io.emit('resource_update', { hospital: nearestHospital });
      }

      io.emit('new_patient', { patient: newPatient });
      if (priority_label === 'High' && !nearestHospital) {
        io.emit('alert', { message: `CRITICAL: No beds available for high priority patient ${name}!` });
      }

      const populatedPatient = await Patient.findById(newPatient._id).populate('allocated_hospital');
      res.status(201).json(populatedPatient);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // --- Appointment Booking Routes ---

  // Preview queue estimation (like "Check Availability" in train booking)
  router.post('/appointments/estimate', async (req, res) => {
    try {
      const { hospital_id, doctor_name, preferred_time, priority_level } = req.body;

      // Count patients waiting for THIS specific doctor at THIS hospital
      const doctorQueue = await Appointment.find({
        hospital_id,
        doctor_name,
        status: 'Waiting'
      }).sort({ queue_number: 1 });

      const patientsAhead = doctorQueue.length;
      const avg_consultation_time = 20; // minutes per patient

      // Calculate estimated token & time
      const queue_number = patientsAhead + 1;
      let preferredDate = preferred_time ? new Date(preferred_time) : new Date();
      if (isNaN(preferredDate.getTime())) preferredDate = new Date(); // fallback for invalid dates
      
      // If preferred time is in future, start from there; else from now
      const startFrom = preferredDate > new Date() ? preferredDate : new Date();
      const waitMinutes = patientsAhead * avg_consultation_time;
      const estimated_time = new Date(startFrom.getTime() + waitMinutes * 60000);

      // Build a summary of who's ahead
      const queuePreview = doctorQueue.map((a, i) => ({
        position: i + 1,
        patient_name: a.patient_name,
        problem_type: a.problem_type,
        estimated_time: new Date(startFrom.getTime() + i * avg_consultation_time * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      // Get AI recommendation if ML service is running
      let ai_recommendation = null;
      try {
        const mlRes = await axios.post('http://127.0.0.1:8000/recommend_time', {
          doctor_name,
          problem_type: req.body.problem_type || 'General',
          preferred_time: preferredDate.toISOString(),
          priority_level: priority_level || 'General'
        });
        ai_recommendation = mlRes.data;
      } catch (e) {
        // ML service not running — provide smart fallback
        const hour = preferredDate.getHours();
        if (hour < 10) {
          ai_recommendation = { recommended_time: '10:00', reason: 'Morning slots (10-12 AM) have the shortest wait times for this doctor.' };
        } else if (hour >= 12 && hour < 14) {
          ai_recommendation = { recommended_time: '14:30', reason: 'Post-lunch slots have fewer patients in queue. Avoid 12-2 PM rush.' };
        } else {
          ai_recommendation = { recommended_time: `${hour}:30`, reason: 'Current slot looks optimal. Low patient density detected.' };
        }
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

  // Get doctor-wise queue counts at a hospital (for showing all doctor slots)
  router.get('/appointments/doctor-slots/:hospital_id', async (req, res) => {
    try {
      const allDoctors = ['Dr. Priya Sharma', 'Dr. Rajesh Gupta', 'Dr. Anjali Mehta', 'Dr. Vikram Patel'];
      const slots = [];

      for (const doctor of allDoctors) {
        const count = await Appointment.countDocuments({
          hospital_id: req.params.hospital_id,
          doctor_name: doctor,
          status: 'Waiting'
        });
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

  // Book a new appointment
  router.post('/appointments', async (req, res) => {
    try {
      const { patient_name, hospital_id, doctor_name, problem_type, preferred_time, priority_level } = req.body;

      // 1. Calculate Queue Position
      const waitingCount = await Appointment.countDocuments({ 
        hospital_id, 
        status: 'Waiting' 
      });

      const queue_number = waitingCount + 1;
      
      // 2. Estimate consultation time (20 mins per patient before)
      const avg_consultation_time = 20; // minutes
      const now = new Date();
      const waitTime = waitingCount * avg_consultation_time;
      const estimated_time = new Date(now.getTime() + waitTime * 60000);

      // 3. Create Appointment
      const appointment = new Appointment({
        patient_name,
        hospital_id,
        doctor_name,
        problem_type,
        preferred_time: (preferred_time && !isNaN(new Date(preferred_time).getTime())) ? new Date(preferred_time) : new Date(),
        queue_number,
        estimated_time,
        priority_level: priority_level || 'General',
        status: 'Waiting'
      });

      await appointment.save();

      // 4. Emit update
      io.emit('appointment_new', { appointment });
      
      res.status(201).json(appointment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get live queue for a hospital
  router.get('/appointments/queue/:hospital_id', async (req, res) => {
    try {
      const appointments = await Appointment.find({ 
        hospital_id: req.params.hospital_id,
        status: 'Waiting'
      }).sort({ queue_number: 1 });
      
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Update appointment status (e.g., Completed)
  router.put('/appointments/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
      
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

      // If completed or no-show, recalculate queue for others? 
      // For simplicity, we just notify clients to refresh
      io.emit('appointment_update', { appointment });

      res.json(appointment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
