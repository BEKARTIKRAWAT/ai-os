from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

from agents import smart_agent
from file_agent import analyze_file
from image_agent import generate_image
from database import (
    save_message,
    get_chat_history,
    get_all_sessions,
    delete_session,
    chats_collection
)
from code_executor import execute_code, detect_language

app = FastAPI(title="AI-OS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
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
    await save_message(session_id, "user", request.message)
    result = smart_agent(request.message, request.history)
    await save_message(
        session_id,
        "assistant",
        result["response"],
        result.get("agent_used", "chat"),
        result.get("tokens_used", 0)
    )
    result["session_id"] = session_id
    return result

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
    return {"sessions": await get_all_sessions()}

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    return {"history": await get_chat_history(session_id)}

@app.delete("/session/{session_id}")
async def delete_session_endpoint(session_id: str):
    await delete_session(session_id)
    return {"message": "Session deleted!"}

@app.get("/analytics")
async def get_analytics():
    pipeline = [
        {"$group": {
            "_id": "$agent",
            "count": {"$sum": 1},
            "total_tokens": {"$sum": "$tokens"}
        }}
    ]
    agent_stats = []
    async for doc in chats_collection.aggregate(pipeline):
        agent_stats.append({
            "agent": doc["_id"],
            "count": doc["count"],
            "total_tokens": doc["total_tokens"]
        })
    total_messages = await chats_collection.count_documents({})
    total_sessions = len(await get_all_sessions())
    total_tokens = sum(a["total_tokens"] for a in agent_stats)
    return {
        "total_messages": total_messages,
        "total_sessions": total_sessions,
        "total_tokens": total_tokens,
        "agent_stats": agent_stats
    }