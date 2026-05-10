from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hundredxmind.vercel.app", "https://hundredxmind.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
sessions_memory = {}
messages_memory = {}

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    session_id: Optional[str] = None

@app.get("/")
def root():
    return {"message": "AI-OS Backend Running on Render!"}

@app.get("/analytics")
async def get_analytics():
    total_messages = sum(len(msgs) for msgs in messages_memory.values())
    total_sessions = len(sessions_memory)
    total_tokens = 0
    
    agent_stats = [
        {"agent": "chat", "count": 0, "total_tokens": 0},
        {"agent": "code", "count": 0, "total_tokens": 0},
        {"agent": "research", "count": 0, "total_tokens": 0},
        {"agent": "debug", "count": 0, "total_tokens": 0},
        {"agent": "search", "count": 0, "total_tokens": 0},
        {"agent": "image", "count": 0, "total_tokens": 0},
        {"agent": "file", "count": 0, "total_tokens": 0},
    ]
    
    return {
        "total_messages": total_messages,
        "total_sessions": total_sessions,
        "total_tokens": total_tokens,
        "agent_stats": agent_stats
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    if session_id not in messages_memory:
        messages_memory[session_id] = []
    
    messages_memory[session_id].append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now().isoformat()
    })
    
    response_text = f"AI-OS: Received your message - '{request.message}'"
    
    messages_memory[session_id].append({
        "role": "assistant",
        "content": response_text,
        "agent": "chat",
        "timestamp": datetime.now().isoformat()
    })
    
    sessions_memory[session_id] = {
        "session_id": session_id,
        "last_message": request.message[:50],
        "last_time": datetime.now().isoformat(),
        "message_count": len(messages_memory[session_id])
    }
    
    return {
        "response": response_text,
        "agent_used": "chat",
        "tokens_used": 100,
        "session_id": session_id
    }

@app.get("/sessions")
async def get_sessions():
    sessions = list(sessions_memory.values())
    sessions.sort(key=lambda x: x["last_time"], reverse=True)
    return {"sessions": sessions}

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    history = messages_memory.get(session_id, [])
    return {"history": history}

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    if session_id in sessions_memory:
        del sessions_memory[session_id]
    if session_id in messages_memory:
        del messages_memory[session_id]
    return {"message": "Session deleted"}

@app.post("/execute-code")
async def execute_code():
    return {"output": "Code execution endpoint", "success": True}

@app.post("/analyze-file")
async def analyze_file():
    return {"response": "File analysis endpoint"}

@app.post("/generate-image")
async def generate_image():
    return {"response": "Image generation endpoint", "image_base64": ""}