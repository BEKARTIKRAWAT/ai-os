from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
import os
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="HundredXMind AI-OS", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Simple in-memory storage
sessions = {}

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@app.get("/")
def root():
    return {"name": "HundredXMind AI-OS", "status": "active", "version": "5.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/chat")
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    
    if session_id not in sessions:
        sessions[session_id] = []
    
    sessions[session_id].append({"role": "user", "content": req.message})
    
    if groq:
        try:
            response = groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are HundredXMind AI-OS, a powerful AI assistant. Be helpful and detailed."},
                    {"role": "user", "content": req.message}
                ],
                temperature=0.7,
                max_tokens=2048
            )
            reply = response.choices[0].message.content
        except Exception as e:
            reply = f"Error: {str(e)}"
    else:
        reply = "GROQ_API_KEY not configured"
    
    sessions[session_id].append({"role": "assistant", "content": reply})
    
    return {"response": reply, "session_id": session_id}

@app.get("/sessions")
def get_sessions():
    return {"sessions": list(sessions.keys())}

@app.get("/history/{session_id}")
def get_history(session_id: str):
    return {"history": sessions.get(session_id, [])}

@app.delete("/session/{session_id}")
def delete_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"message": "Session deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)