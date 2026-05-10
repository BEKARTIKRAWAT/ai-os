from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import requests
import base64
import urllib.parse
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI-OS Backend Running!"}

@app.post("/chat")
async def chat(request: dict):
    session_id = request.get("session_id", str(uuid.uuid4()))
    message = request.get("message", "")
    
    msg_lower = message.lower()
    image_keywords = ["generate", "create", "draw", "4k", "sketch", "anime", "realistic", "cartoon", "3d", "cyberpunk", "image", "photo", "picture", "bnao"]
    
    if any(kw in msg_lower for kw in image_keywords):
        # Generate image
        style = "4k ultra high quality"
        if "sketch" in msg_lower:
            style = "pencil sketch"
        elif "anime" in msg_lower:
            style = "anime style"
        elif "realistic" in msg_lower:
            style = "photorealistic"
        
        clean_prompt = message
        for word in ["generate", "create", "draw", "make", "bnao", "image", "photo", "picture", "4k", "sketch", "anime", "realistic"]:
            clean_prompt = clean_prompt.replace(word, "").strip()
        
        if not clean_prompt:
            clean_prompt = "beautiful scene"
        
        final_prompt = f"{clean_prompt}, {style}, high quality, detailed"
        encoded_prompt = urllib.parse.quote(final_prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
        
        try:
            response = requests.get(image_url, timeout=60)
            if response.status_code == 200:
                image_base64 = base64.b64encode(response.content).decode("utf-8")
                return {
                    "response": f"🎨 Image generated: {clean_prompt} ({style})",
                    "agent_used": "image",
                    "tokens_used": 0,
                    "session_id": session_id,
                    "image_base64": image_base64,
                    "image_type": "image/jpeg"
                }
        except:
            pass
        
        return {
            "response": "❌ Image generation failed. Try '4k tiger' or 'anime cat'",
            "agent_used": "image",
            "tokens_used": 0,
            "session_id": session_id
        }
    
    # Simple text response
    return {
        "response": f"Hello! You said: '{message}'. Try 'generate 4k tiger' for images!",
        "agent_used": "chat",
        "tokens_used": 50,
        "session_id": session_id
    }

@app.post("/generate-image")
async def generate_image_endpoint(request: dict):
    message = request.get("message", "beautiful scene")
    return await chat(request)