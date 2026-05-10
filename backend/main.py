from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import actual AI agents
from agents.agents import smart_agent
from agents.file_agent import analyze_file
from agents.image_agent import generate_image
from agents.code_executor import execute_code, detect_language

app = FastAPI(title="AI-OS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hundredxmind.vercel.app", "https://hundredxmind.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions_memory = {}
messages_memory = {}

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    session_id: Optional[str] = None

class CodeExecuteRequest(BaseModel):
    code: str
    language: Optional[str] = None

@app.get("/")
def root():
    return {"message": "AI-OS Backend Running!"}

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
    
    # ACTUAL AI AGENT CALL - Not dummy response!
    try:
        result = smart_agent(request.message, request.history)
        response_text = result["response"]
        agent_used = result.get("agent_used", "chat")
        tokens_used = result.get("tokens_used", 0)
    except Exception as e:
        response_text = f"Error: {str(e)}"
        agent_used = "chat"
        tokens_used = 0
    
    messages_memory[session_id].append({
        "role": "assistant",
        "content": response_text,
        "agent": agent_used,
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
        "agent_used": agent_used,
        "tokens_used": tokens_used,
        "session_id": session_id
    }

@app.post("/execute-code")
def execute_code_endpoint(request: CodeExecuteRequest):
    language = request.language or detect_language(request.code)
    result = execute_code(request.code, language)
    return {
        "output": result["output"],
        "error": result["error"],
        "success": result["success"],
        "language": language
    }

@app.post("/analyze-file")
async def analyze_file_endpoint(
    file: UploadFile = File(...),
    question: str = Form(default="")
):
    file_bytes = await file.read()
    result = analyze_file(file_bytes, file.filename, question)
    return result

@app.post("/generate-image")
async def generate_image_endpoint(request: ChatRequest):
    return generate_image(request.message)

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
    return {"message": "Session deleted!"}

@app.get("/analytics")
async def get_analytics():
    total_messages = sum(len(msgs) for msgs in messages_memory.values())
    total_sessions = len(sessions_memory)
    return {
        "total_messages": total_messages,
        "total_sessions": total_sessions,
        "total_tokens": 0,
        "agent_stats": []
    }