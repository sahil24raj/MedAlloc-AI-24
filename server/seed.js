const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
require('dotenv').config();

const dummyHospitals = [
  {
    name: "AIIMS Delhi",
    location: { lat: 28.5672, lng: 77.2100 },
    resources: {
      icu_beds: 12,
      general_beds: 50,
      oxygen_cylinders: 100,
      ventilators: 20,
      ambulances: 8
    }
  },
  {
    name: "Fortis Hospital, Mumbai",
    location: { lat: 19.1136, lng: 72.8697 },
    resources: {
      icu_beds: 8,
      general_beds: 35,
      oxygen_cylinders: 60,
      ventilators: 12,
      ambulances: 5
    }
  },
  {
    name: "Apollo Hospital, Chennai",
    location: { lat: 13.0067, lng: 80.2206 },
    resources: {
      icu_beds: 6,
      general_beds: 25,
      oxygen_cylinders: 40,
      ventilators: 8,
      ambulances: 4
    }
  },
  {
    name: "Medanta, Gurugram",
    location: { lat: 28.4395, lng: 77.0266 },
    resources: {
      icu_beds: 10,
      general_beds: 40,
      oxygen_cylinders: 80,
      ventilators: 15,
      ambulances: 6
    }
  },
  {
    name: "Max Super Speciality, Saket",
    location: { lat: 28.5275, lng: 77.2125 },
    resources: {
      icu_beds: 5,
      general_beds: 20,
      oxygen_cylinders: 30,
      ventilators: 6,
      ambulances: 3
    }
  }
];

module.exports = async function seedHospitals() {
  await Hospital.deleteMany({});
  await Hospital.insertMany(dummyHospitals);
  console.log("Indian hospitals seeded successfully.");
};
