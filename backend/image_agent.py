import os

import requests
import base64
from groq import Groq
import urllib.parse

HF_TOKEN = os.environ.get("HF_TOKEN", "")
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def enhance_prompt(user_prompt: str) -> str:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an expert at writing image generation prompts. Convert user's simple description into a detailed, high-quality image generation prompt. Add artistic style, lighting, quality keywords. Keep it under 100 words. Return ONLY the prompt, nothing else."
            },
            {
                "role": "user",
                "content": f"Create an image generation prompt for: {user_prompt}"
            }
        ],
        max_tokens=150
    )
    return response.choices[0].message.content.strip()

def generate_image(prompt: str) -> dict:
    enhanced = enhance_prompt(prompt)
    
    encoded_prompt = urllib.parse.quote(enhanced)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    response = requests.get(image_url, timeout=60)

    print(f"Image size: {len(response.content)} bytes")
    
    if response.status_code == 200:
        image_base64 = base64.b64encode(response.content).decode("utf-8")
        return {
            "response": f"🎨 Image generated!\n\n**Prompt used:**\n{enhanced}",
            "agent_used": "image",
            "tokens_used": 0,
            "image_base64": image_base64,
            "image_type": "image/jpeg"
        }
    else:
        return {
            "response": f"❌ Image generate nahi ho saki! Error: {response.status_code}",
            "agent_used": "image",
            "tokens_used": 0
        }