from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import os
from groq import Groq

app = FastAPI(title="AI-OS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hundredxmind.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None

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
    
    # Real AI response using Groq
    if groq_client:
        try:
            # Prepare messages
            messages = [
                {"role": "system", "content": "You are AI-OS, a helpful AI assistant. Respond in the language the user speaks. Be concise and helpful."}
            ]
            
            # Add history
            for msg in request.history[-10:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # Add current message
            messages.append({"role": "user", "content": request.message})
            
            # Call Groq API
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )
            
            response_text = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
        except Exception as e:
            response_text = f"Error: {str(e)}"
            tokens_used = 0
    else:
        response_text = "GROQ_API_KEY not set. Please add it in Render environment variables."
        tokens_used = 0
    
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
        "tokens_used": tokens_used,
        "session_id": session_id
    }

@app.post("/generate-image")
async def generate_image_endpoint(request: ChatRequest):
    import requests
    import base64
    import urllib.parse
    
    enhanced_prompt = f"A detailed, high-quality image of {request.message}"
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    try:
        response = requests.get(image_url, timeout=60)
        if response.status_code == 200:
            image_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "response": f"🎨 Image generated for: {request.message}",
                "agent_used": "image",
                "tokens_used": 0,
                "image_base64": image_base64,
                "image_type": "image/jpeg"
            }
    except:
        pass
    
    return {
        "response": "Image generation failed. Try again.",
        "agent_used": "image",
        "tokens_used": 0
    }

@app.post("/execute-code")
def execute_code_endpoint(request: CodeExecuteRequest):
    return {"output": "Code execution coming soon", "success": True}

@app.post("/analyze-file")
async def analyze_file_endpoint():
    return {"response": "File analysis coming soon"}

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