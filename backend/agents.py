from dotenv import load_dotenv
load_dotenv()
import os
from groq import Groq
from typing import List

def get_client():
    load_dotenv()
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

AGENTS = {
    "chat": {
        "model": "llama-3.3-70b-versatile",
        "system": """You are AI-OS, an extremely intelligent assistant. 
        You remember full conversation history and help users with any task.
        Be concise, accurate and helpful."""
    },
    "code": {
        "model": "llama-3.3-70b-versatile", 
        "system": """You are an elite software engineer and code expert inside AI-OS.
        Your capabilities:
        - Write production-grade code in ANY language
        - Debug complex issues with detailed explanations
        - Optimize code for performance, memory, and security
        - Review code and find security vulnerabilities
        - Explain code line by line
        - Suggest best practices and design patterns
        - Write unit tests
        Always format code properly with syntax highlighting using markdown code blocks.
        Provide detailed explanations with your code."""
    },
    "research": {
        "model": "llama-3.3-70b-versatile",
        "system": """You are an advanced research analyst inside AI-OS.
        Your capabilities:
        - Deep research on any topic
        - Summarize complex information clearly
        - Compare and contrast different concepts
        - Provide pros and cons analysis
        - Give structured, detailed reports
        Always provide well-structured, comprehensive responses."""
    },
    "debug": {
        "model": "llama-3.3-70b-versatile",
        "system": """You are an expert debugger and problem solver inside AI-OS.
        Your capabilities:
        - Find bugs in any code
        - Explain exactly why the bug occurred
        - Provide step by step fix
        - Analyze error messages and stack traces
        Always be extremely detailed and precise."""
    }
}

def detect_agent(message: str) -> str:
    message_lower = message.lower()
    
    image_keywords = ["generate image", "create image", "draw", "make image", "paint", "illustration", "artwork", "picture of", "image of", "generate a", "create a picture"]
    search_keywords = ["search", "latest", "news", "today", "current", "2024", "2025", "2026", "who is", "what happened", "recent", "live", "price of", "weather", "trending"]
    code_keywords = ["code", "function", "bug", "error", "python", "javascript", "fix", "debug", "write", "program", "script", "class", "api", "database"]
    debug_keywords = ["traceback", "exception", "crash", "not working", "broken", "issue", "problem", "failed", "stack trace"]
    research_keywords = ["research", "explain", "what is", "how does", "compare", "difference", "analyze", "study", "learn about"]
    
    if any(kw in message_lower for kw in image_keywords):
        return "image"
    elif any(kw in message_lower for kw in search_keywords):
        return "search"
    elif any(kw in message_lower for kw in debug_keywords):
        return "debug"
    elif any(kw in message_lower for kw in code_keywords):
        return "code"
    elif any(kw in message_lower for kw in research_keywords):
        return "research"
    else:
        return "chat"

def run_agent(agent_type: str, message: str, history: List = []) -> dict:
    client = get_client()
    agent = AGENTS[agent_type]
    
    messages = [{"role": "system", "content": agent["system"]}]
    
    for msg in history:
        messages.append({
            "role": msg.role if hasattr(msg, 'role') else msg["role"],
            "content": msg.content if hasattr(msg, 'content') else msg["content"]
        })
    
    messages.append({"role": "user", "content": message})
    
    response = client.chat.completions.create(
        model=agent["model"],
        messages=messages,
        temperature=0.7,
        max_tokens=4096
    )
    
    return {
        "response": response.choices[0].message.content,
        "agent_used": agent_type,
        "tokens_used": response.usage.total_tokens
    }

def chat_agent(message: str, history: List = []) -> str:
    agent_type = detect_agent(message)
    if agent_type == "search":
        from web_search_agent import web_search_agent
        return web_search_agent(message, history)["response"]
    if agent_type == "image":
        from image_agent import generate_image
        return generate_image(message)["response"]
    result = run_agent(agent_type, message, history)
    return result["response"]

def smart_agent(message: str, history: List = []) -> dict:
    agent_type = detect_agent(message)
    if agent_type == "search":
        from web_search_agent import web_search_agent
        return web_search_agent(message, history)
    if agent_type == "image":
        from image_agent import generate_image
        return generate_image(message)
    return run_agent(agent_type, message, history)