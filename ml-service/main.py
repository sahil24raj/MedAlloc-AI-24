import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MedAlloc AI - AI Priority Service")

# Initialize Groq client
api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None

class PatientData(BaseModel):
    age: int
    oxygen_level: int
    symptoms_severity: int
    comorbidities: int

@app.post("/predict")
def predict_priority(data: PatientData):
    if not client:
         return {"priority_label": "Medium", "priority_score": 50}

    prompt = f"""
You are an AI medical triage assistant.
Evaluate the following patient data and determine their priority level (Low, Medium, High) and a score (0-100).
Patient Vitals:
- Age: {data.age}
- Oxygen Level: {data.oxygen_level}%
- Symptoms Severity (0-10): {data.symptoms_severity}
- Comorbidities (0=None, 1=Mild, 2=Severe): {data.comorbidities}

Return ONLY a valid JSON object with the exact keys "priority_label" and "priority_score". Do not include markdown formatting or any other text.
Example: {{"priority_label": "High", "priority_score": 85}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-8b-8192",
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        response_content = chat_completion.choices[0].message.content
        result = json.loads(response_content)
        return {
            "priority_label": result.get("priority_label", "Medium"),
            "priority_score": int(result.get("priority_score", 50))
        }
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {
            "priority_label": "Medium", # Fallback
            "priority_score": 50
        }

class AppointmentData(BaseModel):
    doctor_name: str
    problem_type: str
    preferred_time: str
    priority_level: str

@app.post("/predict_no_show")
def predict_no_show(data: AppointmentData):
    if not client:
        return {"no_show_probability": 10}
    prompt = f"""
You are an AI assistant for a hospital.
Predict the probability (0-100) of a patient NOT showing up for their appointment.
Appointment Details:
- Doctor: {data.doctor_name}
- Problem: {data.problem_type}
- Time: {data.preferred_time}
- Priority: {data.priority_level}

Return ONLY a JSON object with the key "no_show_probability".
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        result = json.loads(chat_completion.choices[0].message.content)
        return {"no_show_probability": result.get("no_show_probability", 10)}
    except Exception:
        return {"no_show_probability": 10}

@app.post("/recommend_time")
def recommend_time(data: AppointmentData):
    if not client:
        return {"recommended_time": "14:00", "reason": "Default afternoon slot"}
    prompt = f"""
Recommend the best time slot for a patient with the following problem: {data.problem_type}.
Doctor: {data.doctor_name}.
Current preferred time: {data.preferred_time}.

Return ONLY a JSON object with keys "recommended_time" (HH:MM format) and "reason".
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception:
        return {"recommended_time": "14:00", "reason": "Default afternoon slot"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
