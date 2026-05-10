from dotenv import load_dotenv
load_dotenv()
import os
import requests
import base64
import urllib.parse
import json
from groq import Groq

def get_client():
    load_dotenv()
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

# Image styles supported
IMAGE_STYLES = {
    "4k": "ultra high definition, 4k, 8k, extremely detailed, highest quality, professional photography",
    "hd": "high definition, HD, high quality, detailed, sharp focus",
    "realistic": "photorealistic, real life, authentic, natural lighting, canon camera, 4k",
    "sketch": "pencil sketch, hand drawn, artistic sketch, black and white drawing, line art",
    "anime": "anime style, manga, japanese animation, studio ghibli style, vibrant colors",
    "cartoon": "cartoon style, pixar style, disney animation, colorful, playful",
    "3d": "3D render, cgi, octane render, unreal engine, cinematic lighting, ray tracing",
    "painting": "oil painting, canvas art, brush strokes, masterpiece, fine art",
    "watercolor": "watercolor painting, soft colors, artistic, flowing, ethereal",
    "digital_art": "digital art, concept art, illustration, vibrant, fantasy art",
    "cyberpunk": "cyberpunk style, neon lights, futuristic city, dark atmosphere, synthwave",
    "fantasy": "fantasy art, magical, mystical, epic scene, dramatic lighting",
    "minimalist": "minimalist, simple, clean, geometric, modern art",
    "vintage": "vintage style, retro, old photograph, sepia tone, nostalgic",
    "sketch_pen": "pen sketch, ink drawing, line art, monochrome, detailed strokes",
    "nano": "hyperdetailed, microscopic view, nano scale, intricate details, macro photography",
    "pixel_art": "pixel art, 8-bit style, retro game graphics, blocky, nostalgic",
    "vector": "vector art, flat design, clean lines, modern illustration, gradient colors",
    "graffiti": "graffiti art, street art, spray paint, urban, colorful wall art",
    "abstract": "abstract art, modern art, geometric shapes, vibrant colors, creative"
}

def detect_image_style(prompt: str) -> str:
    """Detect what style user wants from the prompt"""
    prompt_lower = prompt.lower()
    
    if "4k" in prompt_lower or "ultra hd" in prompt_lower:
        return "4k"
    elif "hd" in prompt_lower:
        return "hd"
    elif "realistic" in prompt_lower or "real" in prompt_lower:
        return "realistic"
    elif "sketch" in prompt_lower:
        return "sketch"
    elif "anime" in prompt_lower or "manga" in prompt_lower:
        return "anime"
    elif "cartoon" in prompt_lower or "disney" in prompt_lower:
        return "cartoon"
    elif "3d" in prompt_lower or "render" in prompt_lower:
        return "3d"
    elif "painting" in prompt_lower or "oil" in prompt_lower:
        return "painting"
    elif "watercolor" in prompt_lower:
        return "watercolor"
    elif "digital" in prompt_lower:
        return "digital_art"
    elif "cyberpunk" in prompt_lower:
        return "cyberpunk"
    elif "fantasy" in prompt_lower:
        return "fantasy"
    elif "minimal" in prompt_lower:
        return "minimalist"
    elif "vintage" in prompt_lower or "old" in prompt_lower:
        return "vintage"
    elif "pen" in prompt_lower or "ink" in prompt_lower:
        return "sketch_pen"
    elif "nano" in prompt_lower or "micro" in prompt_lower:
        return "nano"
    elif "pixel" in prompt_lower or "8-bit" in prompt_lower:
        return "pixel_art"
    elif "vector" in prompt_lower or "flat" in prompt_lower:
        return "vector"
    elif "graffiti" in prompt_lower or "street art" in prompt_lower:
        return "graffiti"
    elif "abstract" in prompt_lower:
        return "abstract"
    else:
        return "4k"  # default to 4k

def enhance_prompt(user_prompt: str, style: str) -> str:
    """Enhance user prompt with style details"""
    style_desc = IMAGE_STYLES.get(style, IMAGE_STYLES["4k"])
    
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": f"""You are an expert prompt engineer for image generation.
                Convert user's simple description into a detailed, high-quality image generation prompt.
                Style: {style_desc}
                
                Rules:
                - Add artistic style, lighting, quality keywords
                - Keep under 200 words
                - Make it extremely detailed
                - Return ONLY the prompt, nothing else"""
            },
            {
                "role": "user",
                "content": f"Create an image generation prompt for: {user_prompt}"
            }
        ],
        max_tokens=300,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

def generate_image(prompt: str, width: int = 1024, height: int = 1024) -> dict:
    """Generate image with style detection"""
    
    # Detect style from prompt
    style = detect_image_style(prompt)
    
    # Remove style keywords from prompt for cleaner output
    clean_prompt = prompt
    style_keywords = ["4k", "hd", "realistic", "sketch", "anime", "cartoon", "3d", "painting", "watercolor", "digital", "cyberpunk", "fantasy", "minimal", "vintage", "pen", "nano", "pixel", "vector", "graffiti", "abstract"]
    for kw in style_keywords:
        clean_prompt = clean_prompt.replace(kw, "").replace(kw.upper(), "").strip()
    
    # Enhance prompt with style
    enhanced = enhance_prompt(clean_prompt, style)
    
    # Create final prompt with style
    style_desc = IMAGE_STYLES.get(style, IMAGE_STYLES["4k"])
    final_prompt = f"{enhanced}, {style_desc}, beautiful composition, professional, award-winning"
    
    # Encode for URL
    encoded_prompt = urllib.parse.quote(final_prompt)
    
    # Pollinations API with quality parameters
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={hash(prompt) % 10000}"
    
    # Also try alternative API if needed (Stable Diffusion via Pollinations)
    alt_url = f"https://pollinations.ai/p/{encoded_prompt}?width={width}&height={height}"
    
    try:
        # Try primary API
        response = requests.get(image_url, timeout=90, headers={"User-Agent": "Mozilla/5.0"})
        
        if response.status_code == 200 and len(response.content) > 10000:
            image_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "response": f"🎨 **Image Generated Successfully!**\n\n**Style:** {style.upper()}\n**Subject:** {clean_prompt}\n**Resolution:** {width}x{height}\n\n![Generated Image](data:image/jpeg;base64,{image_base64[:50]}...)",
                "agent_used": "image",
                "tokens_used": 0,
                "image_base64": image_base64,
                "image_type": "image/jpeg",
                "style": style,
                "prompt_used": final_prompt
            }
        else:
            # Try alternative URL
            response = requests.get(alt_url, timeout=90)
            if response.status_code == 200 and len(response.content) > 10000:
                image_base64 = base64.b64encode(response.content).decode("utf-8")
                return {
                    "response": f"🎨 **Image Generated!** (Alternative API)\n\n**Style:** {style.upper()}\n**Subject:** {clean_prompt}",
                    "agent_used": "image",
                    "tokens_used": 0,
                    "image_base64": image_base64,
                    "image_type": "image/jpeg",
                    "style": style
                }
            else:
                return {
                    "response": f"❌ **Image generation failed**\n\nTry:\n- 'generate 4k image of a cat'\n- 'anime style dog running'\n- 'sketch of a mountain'\n- 'realistic portrait of a lion'\n- 'cyberpunk city at night'",
                    "agent_used": "image",
                    "tokens_used": 0
                }
    except Exception as e:
        return {
            "response": f"❌ Error: {str(e)[:100]}\n\nTry again with different prompt!",
            "agent_used": "image",
            "tokens_used": 0
        }

def generate_image_with_custom_style(prompt: str, style: str, width: int = 1024, height: int = 1024) -> dict:
    """Generate image with custom specified style"""
    
    style_desc = IMAGE_STYLES.get(style, IMAGE_STYLES["4k"])
    final_prompt = f"{prompt}, {style_desc}, high quality, detailed"
    
    encoded_prompt = urllib.parse.quote(final_prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
    
    try:
        response = requests.get(image_url, timeout=90)
        if response.status_code == 200:
            image_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "response": f"🎨 {style.upper()} style image generated!",
                "agent_used": "image",
                "tokens_used": 0,
                "image_base64": image_base64,
                "image_type": "image/jpeg"
            }
    except:
        pass
    
    return {
        "response": f"❌ Failed to generate {style} image. Try another style!",
        "agent_used": "image",
        "tokens_used": 0
    }