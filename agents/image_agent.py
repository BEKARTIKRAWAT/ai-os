import os
import requests
import base64
import urllib.parse

# Image styles supported
IMAGE_STYLES = {
    "4k": "ultra high definition, 4k, extremely detailed, highest quality",
    "sketch": "pencil sketch, hand drawn, artistic sketch, black and white",
    "anime": "anime style, manga, japanese animation, vibrant colors",
    "realistic": "photorealistic, real life, authentic, natural lighting",
    "cartoon": "cartoon style, colorful, playful",
    "3d": "3D render, cgi, cinematic lighting, ray tracing",
    "cyberpunk": "cyberpunk style, neon lights, futuristic city",
    "watercolor": "watercolor painting, soft colors, artistic",
    "pixel_art": "pixel art, 8-bit style, retro game graphics",
    "nano": "microscopic view, nano scale, intricate details"
}

def detect_image_style(prompt):
    prompt_lower = prompt.lower()
    
    if "4k" in prompt_lower or "ultra" in prompt_lower:
        return "4k"
    elif "sketch" in prompt_lower:
        return "sketch"
    elif "anime" in prompt_lower or "manga" in prompt_lower:
        return "anime"
    elif "realistic" in prompt_lower or "real" in prompt_lower:
        return "realistic"
    elif "cartoon" in prompt_lower:
        return "cartoon"
    elif "3d" in prompt_lower or "render" in prompt_lower:
        return "3d"
    elif "cyberpunk" in prompt_lower:
        return "cyberpunk"
    elif "watercolor" in prompt_lower:
        return "watercolor"
    elif "pixel" in prompt_lower or "8-bit" in prompt_lower:
        return "pixel_art"
    elif "nano" in prompt_lower or "micro" in prompt_lower:
        return "nano"
    else:
        return "4k"

def generate_image(prompt, width=1024, height=1024):
    """Generate image with style detection"""
    
    style = detect_image_style(prompt)
    style_desc = IMAGE_STYLES.get(style, IMAGE_STYLES["4k"])
    
    # Clean prompt
    clean_prompt = prompt
    style_words = ["4k", "hd", "realistic", "sketch", "anime", "cartoon", "3d", 
                   "cyberpunk", "watercolor", "pixel", "nano", "generate", 
                   "create", "draw", "make", "image", "photo", "picture"]
    for word in style_words:
        clean_prompt = clean_prompt.replace(word, "").strip()
    
    if not clean_prompt:
        clean_prompt = "beautiful scene"
    
    final_prompt = f"{clean_prompt}, {style_desc}, high quality, beautiful, detailed"
    encoded_prompt = urllib.parse.quote(final_prompt)
    
    # Pollinations AI
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
    
    try:
        response = requests.get(image_url, timeout=60)
        if response.status_code == 200 and len(response.content) > 10000:
            image_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "response": f"🎨 **Image Generated!**\n\n**Style:** {style.upper()}\n**Subject:** {clean_prompt}",
                "agent_used": "image",
                "tokens_used": 0,
                "image_base64": image_base64,
                "image_type": "image/jpeg",
                "style": style
            }
        else:
            return {
                "response": "❌ Image generation failed. Try: '4k realistic tiger' or 'anime cat'",
                "agent_used": "image",
                "tokens_used": 0
            }
    except Exception as e:
        return {
            "response": f"❌ Error: {str(e)[:100]}. Please try again.",
            "agent_used": "image",
            "tokens_used": 0
        }