const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patient_name: { type: String, required: true },
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  doctor_name: { type: String, required: true },
  problem_type: { type: String, required: true },
  preferred_time: { type: Date, required: true },
  queue_number: { type: Number, required: true },
  estimated_time: { type: Date, required: true },
  priority_level: { 
    type: String, 
    enum: ['General', 'Priority', 'Emergency'], 
    default: 'General' 
  },
  status: { 
    type: String, 
    enum: ['Waiting', 'Completed', 'No-show'], 
    default: 'Waiting' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
