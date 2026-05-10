from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, AsyncGenerator
import uuid
from datetime import datetime
import os
import requests
import base64
import urllib.parse
import json
from groq import Groq
import asyncio

app = FastAPI(title="AI-OS Backend - Ultimate AI Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hundredxmind.vercel.app", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq (Fastest AI)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None

# Memory storage
sessions_memory = {}
messages_memory = {}

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    session_id: Optional[str] = None
    stream: bool = False

class CodeExecuteRequest(BaseModel):
    code: str
    language: Optional[str] = None

# System Prompt - Makes AI-OS as powerful as ChatGPT
SYSTEM_PROMPT = """You are AI-OS, a world-class AI assistant built by Kartik Rawat. You are as powerful as ChatGPT, Groq, Gemini, and Claude combined.

**Your Capabilities:**
- Answer any question accurately and helpfully
- Write, debug, and optimize code in any programming language
- Analyze, summarize, and extract insights from documents
- Generate creative content, stories, poems, scripts
- Explain complex topics simply and clearly
- Provide step-by-step guidance for any task
- Think step-by-step before answering difficult questions
- Be honest - if you don't know something, say so
- Respond in the same language as the user (Hindi, English, etc.)

**Your Personality:**
- Professional but friendly
- Detailed but not overly verbose
- Helpful and patient
- Enthusiastic about solving problems

**Current Date & Time:** {current_datetime}

Always provide accurate, helpful, and well-structured responses."""

def get_system_prompt():
    return SYSTEM_PROMPT.format(current_datetime=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

@app.get("/")
def root():
    return {"message": "AI-OS Backend - Ultimate AI Platform Running!", "status": "active", "ai_model": "Groq Llama 3.3 70B"}

@app.post("/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    if session_id not in messages_memory:
        messages_memory[session_id] = []
    
    # Save user message
    messages_memory[session_id].append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now().isoformat()
    })
    
    # Check if user wants image generation
    msg_lower = request.message.lower()
    image_keywords = ["generate image", "create image", "draw", "make image", "bnao", "photo", "picture", "4k", "sketch", "anime", "realistic", "cartoon", "3d", "cyberpunk", "pixel", "watercolor", "portrait", "wallpaper"]
    
    if any(kw in msg_lower for kw in image_keywords) and ("image" in msg_lower or "photo" in msg_lower or "picture" in msg_lower or "bnao" in msg_lower):
        # Generate image
        image_result = await generate_image_handler(request.message)
        
        messages_memory[session_id].append({
            "role": "assistant",
            "content": image_result["response"],
            "agent": "image",
            "timestamp": datetime.now().isoformat()
        })
        
        sessions_memory[session_id] = {
            "session_id": session_id,
            "last_message": request.message[:50],
            "last_time": datetime.now().isoformat(),
            "message_count": len(messages_memory[session_id])
        }
        
        result = {
            "response": image_result["response"],
            "agent_used": "image",
            "tokens_used": 0,
            "session_id": session_id
        }
        
        if image_result.get("image_base64"):
            result["image_base64"] = image_result["image_base64"]
            result["image_type"] = image_result.get("image_type", "image/jpeg")
            result["style"] = image_result.get("style", "4k")
        
        return result
    
    # Check for code execution
    code_keywords = ["run code", "execute", "python code", "javascript code", "run this"]
    is_code_request = any(kw in msg_lower for kw in code_keywords) and ("```" in request.message or "def " in request.message or "print(" in request.message)
    
    if is_code_request:
        # Extract code and run
        import re
        code_match = re.search(r'```(\w+)?\n(.*?)```', request.message, re.DOTALL)
        if code_match:
            language = code_match.group(1) or "python"
            code = code_match.group(2)
            result = await execute_code_handler(code, language)
            response_text = f"**Code Execution Result:**\n```\n{result['output']}\n```\n{result.get('error', '')}"
            agent_used = "code"
            tokens_used = 0
        else:
            response_text = await get_ai_response(request.message, request.history)
            agent_used = "chat"
            tokens_used = 0
    else:
        # Regular AI chat
        response_text = await get_ai_response(request.message, request.history)
        agent_used = "chat"
        tokens_used = 0
    
    # Save assistant response
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

async def get_ai_response(message: str, history: List[dict]) -> str:
    """Get response from Groq AI - as powerful as ChatGPT"""
    
    if not groq_client:
        return "⚠️ GROQ_API_KEY not set. Please add it in Render environment variables to enable AI responses."
    
    try:
        # Build messages
        messages = [
            {"role": "system", "content": get_system_prompt()}
        ]
        
        # Add conversation history (last 15 messages for context)
        for msg in history[-15:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        # Call Groq API (fastest LLM available)
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
            top_p=0.9
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"❌ Error: {str(e)}"

async def generate_image_handler(prompt: str):
    """Generate image with multiple styles"""
    
    # Detect style
    msg_lower = prompt.lower()
    
    style_map = {
        "4k": "ultra high definition 4k, extremely detailed, highest quality, professional",
        "realistic": "photorealistic, real life, authentic, natural lighting, canon camera",
        "sketch": "pencil sketch, hand drawn, artistic sketch, black and white, line art",
        "anime": "anime style, manga, japanese animation, studio ghibli, vibrant colors",
        "cartoon": "cartoon style, pixar style, colorful, playful, disney animation",
        "3d": "3D render, cgi, octane render, unreal engine, cinematic lighting",
        "cyberpunk": "cyberpunk style, neon lights, futuristic city, dark atmosphere",
        "watercolor": "watercolor painting, soft colors, artistic flowing brush strokes",
        "painting": "oil painting, canvas art, brush strokes, masterpiece, fine art",
        "pixel": "pixel art, 8-bit style, retro game graphics, blocky, nostalgic",
        "nano": "microscopic view, nano scale, intricate details, macro photography",
        "vector": "vector art, flat design, clean lines, modern illustration",
        "graffiti": "graffiti art, street art, spray paint, urban, colorful wall art"
    }
    
    style = "4k"
    for s in style_map:
        if s in msg_lower:
            style = s
            break
    
    style_desc = style_map.get(style, style_map["4k"])
    
    # Clean prompt
    clean_prompt = prompt
    for word in ["generate", "create", "draw", "make", "bnao", "image", "photo", "picture", "4k", "sketch", "anime", "realistic", "cartoon", "3d", "cyberpunk", "watercolor", "painting", "pixel", "nano", "vector", "graffiti", "wallpaper", "portrait"]:
        clean_prompt = clean_prompt.replace(word, "").strip()
    
    if not clean_prompt:
        clean_prompt = "beautiful artistic scene"
    
    final_prompt = f"{clean_prompt}, {style_desc}, beautiful composition, award-winning photography, sharp focus, vibrant colors"
    encoded_prompt = urllib.parse.quote(final_prompt)
    
    # Pollinations AI (Free image generation)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={abs(hash(prompt)) % 10000}"
    
    try:
        response = requests.get(image_url, timeout=90)
        if response.status_code == 200 and len(response.content) > 10000:
            image_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "response": f"🎨 **Image Generated Successfully!**\n\n**Style:** {style.upper()}\n**Subject:** {clean_prompt}\n\nClick the image to view full size.",
                "agent_used": "image",
                "tokens_used": 0,
                "image_base64": image_base64,
                "image_type": "image/jpeg",
                "style": style
            }
        else:
            return {
                "response": "❌ Image generation failed. Please try a different prompt.\n\n**Examples:**\n- '4k realistic tiger image generate karo'\n- 'anime style cat drawing'\n- 'cyberpunk city at night'",
                "agent_used": "image",
                "tokens_used": 0
            }
    except Exception as e:
        return {
            "response": f"❌ Error: {str(e)}",
            "agent_used": "image",
            "tokens_used": 0
        }

async def execute_code_handler(code: str, language: str):
    """Execute code safely"""
    import subprocess
    import tempfile
    
    try:
        if language == "python":
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            result = subprocess.run(
                ['python', temp_file],
                capture_output=True,
                text=True,
                timeout=30
            )
            os.unlink(temp_file)
            
            return {
                "output": result.stdout if result.stdout else "No output",
                "error": result.stderr if result.stderr else None
            }
        else:
            return {"output": f"Code execution for {language} coming soon", "error": None}
    except Exception as e:
        return {"output": "", "error": str(e)}

@app.post("/generate-image")
async def generate_image_endpoint(request: ChatRequest):
    return await generate_image_handler(request.message)

@app.post("/execute-code")
async def execute_code_endpoint(request: CodeExecuteRequest):
    result = await execute_code_handler(request.code, request.language or "python")
    return result

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
    agent_stats = []
    return {
        "total_messages": total_messages,
        "total_sessions": total_sessions,
        "total_tokens": 0,
        "agent_stats": agent_stats
    }