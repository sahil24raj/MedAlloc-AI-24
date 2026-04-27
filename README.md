# 🏥 MedAlloc AI — Smart Hospital Resource Allocation System

MedAlloc AI is a full-stack, AI-powered web application designed to intelligently assign limited hospital resources (ICU beds, oxygen, ventilators) to patients based on urgency and real-time availability. It also features a **Smart Appointment Booking System** inspired by railway ticket booking, complete with queue prediction, token generation, and live tracking.

---

## 🚀 Features

### Core — AI Resource Allocation
- **Real-Time Dashboard**: Monitor hospital capacities via dynamic charts.
- **AI Priority Engine**: Groq Cloud API (LLaMA 3) evaluates patient vitals and assigns a priority score (Low/Medium/High) instantly.
- **Smart Allocation**: Automatically assigns high-priority patients to nearest hospitals with available ICU beds/ventilators.
- **WebSocket Alerts**: Real-time notifications for new patients and resource depletion.

### 🎫 Smart Appointment Booking System (NEW)
- **Queue-Based Booking**: Patients receive a token number and estimated consultation time instead of fixed time slots.
- **Smart Queue Algorithm**: Dynamically calculates wait times using `avg_consultation_time × patients_before_you`.
- **Slot Types**: General Queue, Priority Queue, and Emergency (instant allocation).
- **Live Queue Tracker**: Real-time view of current queue, estimated wait, and patient positions with Socket.io.
- **Ticket-Style UI**: Beautiful train-ticket inspired booking confirmation card.
- **AI No-Show Prediction**: ML endpoint predicts probability of patient not showing up.
- **AI Time Recommendation**: Suggests optimal booking times based on problem type and doctor availability.

---

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js (Vite), Tailwind CSS, Chart.js, Lucide Icons, React Router |
| **Backend** | Node.js, Express.js, MongoDB (Memory Server), Socket.io |
| **AI Service** | Python, FastAPI, Groq Cloud API (LLaMA 3) |

---

## 🏗️ System Architecture

```
┌──────────────────┐     REST + WebSocket     ┌──────────────────┐     HTTP     ┌──────────────────┐
│   React Client   │ ◄──────────────────────► │  Node.js/Express │ ◄──────────► │  FastAPI (AI)    │
│   (Vite + TW)    │                          │  + Socket.io     │              │  Groq LLaMA 3    │
│   Port: 5173     │                          │  Port: 5000      │              │  Port: 8000      │
└──────────────────┘                          └──────────────────┘              └──────────────────┘
                                                      │
                                              ┌───────┴────────┐
                                              │  MongoDB       │
                                              │  (In-Memory)   │
                                              └────────────────┘
```

---

## 📡 API Endpoints

### Backend Server (`localhost:5000`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hospitals` | Fetch all hospitals and resources |
| `GET` | `/api/patients` | Fetch all patients with allocated hospitals |
| `POST` | `/api/patients` | Submit patient → AI priority → auto-allocate hospital |
| `POST` | `/api/appointments` | Book appointment → get queue token + estimated time |
| `GET` | `/api/appointments/queue/:hospital_id` | Live queue for a hospital |
| `PUT` | `/api/appointments/:id/status` | Update appointment status (Completed/No-show) |

### AI Microservice (`localhost:8000`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Priority scoring (age, oxygen, severity, comorbidities) |
| `POST` | `/predict_no_show` | No-show probability prediction |
| `POST` | `/recommend_time` | Optimal booking time recommendation |
| `GET` | `/health` | Health check |

---

## ⚙️ Setup & Installation

### 1. AI Microservice (`/ml-service`)
```bash
cd ml-service
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt

# Create .env with Groq API Key
echo GROQ_API_KEY=your_api_key_here > .env

uvicorn main:app --reload --port 8000
```
> **Note:** The system works without a GROQ_API_KEY — it will fall back to default priority scores.

### 2. Node Backend Server (`/server`)
```bash
cd server
npm install
npm start
```
> Uses in-memory MongoDB by default. Set `MONGO_URI` in `.env` for persistent storage.

### 3. React Frontend (`/client`)
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Demo Scenarios

### Scenario 1: AI Patient Triage
1. Start all three services.
2. Open `http://localhost:5173` → Dashboard shows 3 pre-loaded hospitals.
3. Navigate to **Patient Intake**.
4. Enter high-priority patient: Age 75, Severity 95, SpO2 75%, Comorbidities Severe.
5. Submit → AI marks as "High Priority", allocates ICU bed at nearest hospital.

### Scenario 2: Smart Appointment Booking
1. Navigate to **Book Appointment**.
2. Select a hospital, doctor, set preferred time, and choose priority level.
3. Click **Generate Smart Token** → receive a ticket-style confirmation with:
   - Queue number
   - Estimated consultation time
   - Wait position
4. Navigate to **Live Queue** to see real-time queue status and manage appointments.

---

## 📁 Project Structure
```
AI HOSPITAL SYSTEM/
├── client/                    # React Frontend
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx          # Hospital resource overview
│       │   ├── PatientForm.jsx        # New patient intake form
│       │   ├── AppointmentBooking.jsx # Smart booking + ticket UI
│       │   └── LiveQueueTracker.jsx   # Real-time queue monitor
│       ├── App.jsx                    # Main app with routing
│       └── index.css                  # Glassmorphism design system
├── server/                    # Node.js Backend
│   ├── models/
│   │   ├── Hospital.js
│   │   ├── Patient.js
│   │   └── Appointment.js
│   ├── routes/
│   │   └── api.js
│   ├── seed.js
│   └── index.js
├── ml-service/                # Python AI Service
│   ├── main.py
│   └── requirements.txt
└── README.md
```

---

*Built for the Hackathon. Powered by AI. 🚀*
