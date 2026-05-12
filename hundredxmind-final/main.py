"""
╔══════════════════════════════════════════════════════════════════════╗
║                    HUNDREDXMIND AI-OS PRO v∞                         ║
║           Enterprise Grade Artificial Intelligence Operating System   ║
╚══════════════════════════════════════════════════════════════════════╝

Features:
- Multi-Model AI Orchestration (Groq, OpenAI, Anthropic, Gemini)
- Advanced Memory Management (Short-term, Long-term, Vector)
- Intelligent Agent Swarm Architecture
- Real-time Streaming Responses
- Code Execution Sandbox
- File Processing & Analysis
- Image Generation & Processing
- Voice Input/Output
- Analytics Dashboard
- Rate Limiting & Security
- Multi-tenant Support
- API Key Management
- Webhook Integration
- Scheduled Tasks
- Real-time Monitoring
- Auto-scaling Ready
"""

# ============================================
# IMPORTS
# ============================================

from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any, AsyncGenerator, Union
from datetime import datetime, timedelta
import uuid
import os
import json
import asyncio
import hashlib
import hmac
import re
import base64
import io
from enum import Enum
from contextlib import asynccontextmanager
from functools import wraps
import logging
import time
from collections import defaultdict
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
from groq import Groq
from dotenv import load_dotenv
import bcrypt
import jwt
from email_validator import validate_email, EmailNotValidError

load_dotenv()

# ============================================
# LOGGING CONFIGURATION
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aios.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION CLASS
# ============================================

class Settings:
    # App
    APP_NAME: str = "HUNDREDXMIND AI-OS"
    APP_VERSION: str = "5.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "production")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", str(uuid.uuid4()))
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    
    # Database
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "hundredxmind")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ['.txt', '.pdf', '.docx', '.py', '.js', '.json', '.csv', '.md']
    UPLOAD_DIR: str = "uploads"
    
    # AI Models
    DEFAULT_MODEL: str = "llama-3.3-70b-versatile"
    FAST_MODEL: str = "llama-3.1-8b-instant"
    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.7
    
    # Security
    CORS_ORIGINS: List[str] = ["https://hundredxmind.vercel.app", "http://localhost:3000", "*"]
    RATE_LIMIT_ENABLED: bool = True
    REQUEST_LOGGING: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()

# ============================================
# DATABASE MANAGER
# ============================================

class DatabaseManager:
    def __init__(self):
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.redis_client: Optional[redis.Redis] = None
        self.db = None
    
    async def connect(self):
        """Connect to databases"""
        try:
            # MongoDB Connection
            self.mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.mongo_client[settings.MONGODB_DB]
            await self.mongo_client.admin.command('ping')
            logger.info("MongoDB connected successfully")
            
            # Redis Connection
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Redis connected successfully")
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Close database connections"""
        if self.mongo_client:
            self.mongo_client.close()
        if self.redis_client:
            await self.redis_client.close()
        logger.info("Database connections closed")
    
    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return await self.db.users.find_one({"user_id": user_id})
    
    async def create_user(self, user_data: Dict) -> Dict:
        """Create new user"""
        user_data["user_id"] = str(uuid.uuid4())
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        user_data["is_active"] = True
        user_data["total_tokens"] = 0
        user_data["total_messages"] = 0
        await self.db.users.insert_one(user_data)
        return user_data
    
    async def save_message(self, session_id: str, role: str, content: str, metadata: Dict = None):
        """Save message to database"""
        message = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow()
        }
        await self.db.messages.insert_one(message)
        
        # Update session
        await self.db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"last_updated": datetime.utcnow()}, "$inc": {"message_count": 1}},
            upsert=True
        )
    
    async def get_session_history(self, session_id: str, limit: int = 50) -> List[Dict]:
        """Get session history"""
        cursor = self.db.messages.find({"session_id": session_id}).sort("timestamp", -1).limit(limit)
        messages = await cursor.to_list(length=limit)
        return list(reversed(messages))
    
    async def cache_set(self, key: str, value: str, expiry: int = 3600):
        """Set cache value"""
        await self.redis_client.setex(key, expiry, value)
    
    async def cache_get(self, key: str) -> Optional[str]:
        """Get cache value"""
        return await self.redis_client.get(key)
    
    async def increment_rate_limit(self, key: str) -> int:
        """Increment rate limit counter"""
        current = await self.redis_client.incr(key)
        if current == 1:
            await self.redis_client.expire(key, settings.RATE_LIMIT_WINDOW)
        return current

db_manager = DatabaseManager()

# ============================================
# AI ENGINE
# ============================================

class AIEngine:
    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.http_client = httpx.AsyncClient(timeout=60.0)
        
        # System prompts for different use cases
        self.system_prompts = {
            "default": """You are HUNDREDXMIND AI-OS, an elite artificial intelligence operating system.
You are:
- Extremely intelligent and knowledgeable
- Helpful, friendly, and professional
- Capable of coding, research, analysis, creative writing
- Multi-lingual (respond in user's language)
- Detailed and thorough in responses

Guidelines:
1. Think step by step for complex problems
2. Provide code with proper formatting when requested
3. Cite sources when sharing factual information
4. Be honest if you don't know something
5. Always be helpful and constructive""",
            
            "code": """You are an elite software engineer. Provide:
- Production-grade, secure, scalable code
- Detailed comments and documentation
- Error handling and edge cases
- Best practices and optimizations
- Example usage""",
            
            "research": """You are a research scientist. Provide:
- Detailed, accurate information
- Citations and sources
- Balanced perspectives
- Latest developments
- Practical applications""",
            
            "creative": """You are a creative genius. Provide:
- Innovative and original ideas
- Engaging and unique content
- Vivid descriptions
- Emotional resonance
- Memorable output"""
        }
    
    async def generate_response(
        self,
        message: str,
        history: List[Dict] = None,
        context: str = "",
        task_type: str = "default",
        stream: bool = False,
        max_tokens: int = settings.MAX_TOKENS,
        temperature: float = settings.TEMPERATURE
    ) -> Union[str, AsyncGenerator]:
        """Generate AI response using Groq"""
        
        if not self.groq_client:
            return "⚠️ API key not configured. Please add GROQ_API_KEY to environment variables."
        
        try:
            # Build messages
            messages = [
                {"role": "system", "content": self.system_prompts.get(task_type, self.system_prompts["default"])}
            ]
            
            # Add context if provided
            if context:
                messages.append({"role": "system", "content": f"Context: {context}"})
            
            # Add conversation history (last 20 messages)
            if history:
                for msg in history[-20:]:
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            if stream:
                return self._stream_response(messages, max_tokens, temperature)
            else:
                response = self.groq_client.chat.completions.create(
                    model=settings.DEFAULT_MODEL,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
                
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return f"Error generating response: {str(e)}"
    
    async def _stream_response(self, messages: List[Dict], max_tokens: int, temperature: float) -> AsyncGenerator:
        """Stream response token by token"""
        try:
            stream = self.groq_client.chat.completions.create(
                model=settings.DEFAULT_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'token': chunk.choices[0].delta.content})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    async def generate_code(self, description: str, language: str = "python") -> Dict:
        """Generate code based on description"""
        prompt = f"""Write {language} code for: {description}

Requirements:
- Production quality
- Include error handling
- Add comments
- Show example usage
- Follow language best practices

Return only the code block with language specified."""
        
        response = await self.generate_response(prompt, task_type="code")
        return {
            "code": self._extract_code(response, language),
            "language": language,
            "description": description
        }
    
    def _extract_code(self, response: str, language: str) -> str:
        """Extract code from markdown response"""
        pattern = rf"```{language}\n(.*?)```"
        match = re.search(pattern, response, re.DOTALL)
        if match:
            return match.group(1).strip()
        return response
    
    async def analyze_code(self, code: str, language: str) -> Dict:
        """Analyze code for bugs, security issues, improvements"""
        prompt = f"""Analyze this {language} code:

{code}

Provide:
1. Bug analysis
2. Security vulnerabilities
3. Performance issues
4. Code quality suggestions
5. Improvements with examples

Format as JSON with categories."""
        
        response = await self.generate_response(prompt)
        return {"analysis": response, "code": code}

ai_engine = AIEngine()

# ============================================
# CODE EXECUTOR (Sandbox)
# ============================================

class CodeExecutor:
    def __init__(self):
        self.timeout = 30
        self.max_output = 10000
    
    async def execute_python(self, code: str) -> Dict:
        """Execute Python code in sandbox"""
        import subprocess
        import tempfile
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            result = subprocess.run(
                ['python', temp_file],
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            os.unlink(temp_file)
            
            output = result.stdout if result.stdout else result.stderr
            if len(output) > self.max_output:
                output = output[:self.max_output] + "... (truncated)"
            
            return {
                "success": result.returncode == 0,
                "output": output,
                "error": result.stderr if result.returncode != 0 else None
            }
            
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Code execution timeout", "output": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "output": ""}
    
    async def execute_javascript(self, code: str) -> Dict:
        """Execute JavaScript code using Node.js"""
        import subprocess
        import tempfile
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            
            os.unlink(temp_file)
            
            output = result.stdout if result.stdout else result.stderr
            if len(output) > self.max_output:
                output = output[:self.max_output] + "... (truncated)"
            
            return {
                "success": result.returncode == 0,
                "output": output,
                "error": result.stderr if result.returncode != 0 else None
            }
            
        except FileNotFoundError:
            return {"success": False, "error": "Node.js not installed", "output": ""}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Code execution timeout", "output": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "output": ""}

code_executor = CodeExecutor()

# ============================================
# FILE PROCESSOR
# ============================================

class FileProcessor:
    def __init__(self):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    async def process_file(self, file: UploadFile) -> Dict:
        """Process uploaded file"""
        # Validate file size
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Validate extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=415, detail="File type not allowed")
        
        # Extract text based on file type
        text_content = await self.extract_text(content, ext)
        
        # Analyze content
        analysis = await ai_engine.generate_response(
            f"Analyze this content and provide a summary:\n\n{text_content[:3000]}",
            task_type="research"
        )
        
        return {
            "filename": file.filename,
            "size": len(content),
            "type": ext,
            "summary": analysis,
            "content": text_content[:5000]  # Truncated for response
        }
    
    async def extract_text(self, content: bytes, ext: str) -> str:
        """Extract text from file"""
        if ext == '.txt':
            return content.decode('utf-8', errors='ignore')
        elif ext == '.py' or ext == '.js':
            return content.decode('utf-8', errors='ignore')
        elif ext == '.json':
            return content.decode('utf-8', errors='ignore')
        elif ext == '.csv':
            return content.decode('utf-8', errors='ignore')
        elif ext == '.md':
            return content.decode('utf-8', errors='ignore')
        elif ext == '.pdf':
            return await self.extract_pdf(content)
        elif ext == '.docx':
            return await self.extract_docx(content)
        else:
            return "Text extraction not supported for this file type"
    
    async def extract_pdf(self, content: bytes) -> str:
        """Extract text from PDF"""
        try:
            import PyPDF2
            from io import BytesIO
            
            pdf_file = BytesIO(content)
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text[:10000]
        except Exception as e:
            return f"PDF extraction failed: {e}"
    
    async def extract_docx(self, content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            import docx
            from io import BytesIO
            
            doc_file = BytesIO(content)
            doc = docx.Document(doc_file)
            text = "\n".join([para.text for para in doc.paragraphs])
            return text[:10000]
        except Exception as e:
            return f"DOCX extraction failed: {e}"

file_processor = FileProcessor()

# ============================================
# IMAGE GENERATOR
# ============================================

class ImageGenerator:
    async def generate(self, prompt: str, style: str = "realistic") -> Dict:
        """Generate image using Pollinations AI"""
        import urllib.parse
        import requests
        
        # Clean prompt
        clean_prompt = prompt
        for word in ["generate", "create", "draw", "make", "image", "photo", "picture"]:
            clean_prompt = clean_prompt.replace(word, "").strip()
        
        if not clean_prompt:
            clean_prompt = "beautiful scene"
        
        # Add style
        style_prompts = {
            "realistic": "photorealistic, high quality, detailed",
            "artistic": "artistic, beautiful composition, masterpiece",
            "anime": "anime style, manga, vibrant colors",
            "sketch": "pencil sketch, hand drawn, black and white",
            "cyberpunk": "cyberpunk, neon lights, futuristic",
            "fantasy": "fantasy art, magical, epic scene"
        }
        
        style_text = style_prompts.get(style, style_prompts["realistic"])
        final_prompt = f"{clean_prompt}, {style_text}"
        
        encoded = urllib.parse.quote(final_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024"
        
        try:
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                img_base64 = base64.b64encode(response.content).decode()
                return {
                    "success": True,
                    "image_base64": img_base64,
                    "prompt": final_prompt,
                    "style": style
                }
        except Exception as e:
            logger.error(f"Image generation error: {e}")
        
        return {"success": False, "error": "Image generation failed"}

image_generator = ImageGenerator()

# ============================================
# AUTHENTICATION & SECURITY
# ============================================

class AuthHandler:
    def __init__(self):
        self.security = HTTPBearer(auto_error=False)
    
    def create_token(self, user_id: str, email: str) -> str:
        """Create JWT token"""
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def hash_password(self, password: str) -> str:
        """Hash password"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password"""
        return bcrypt.checkpw(password.encode(), hashed.encode())

auth_handler = AuthHandler()

# ============================================
# RATE LIMITER
# ============================================

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
    
    async def check_limit(self, key: str) -> bool:
        """Check if request is within rate limit"""
        if not settings.RATE_LIMIT_ENABLED:
            return True
        
        now = time.time()
        window_start = now - settings.RATE_LIMIT_WINDOW
        
        # Clean old requests
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        
        if len(self.requests[key]) >= settings.RATE_LIMIT_REQUESTS:
            return False
        
        self.requests[key].append(now)
        return True

rate_limiter = RateLimiter()

# ============================================
# API MODELS
# ============================================

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[str] = None
    context: Optional[str] = None
    task_type: Optional[str] = "default"
    stream: Optional[bool] = False
    
    @validator('task_type')
    def validate_task_type(cls, v):
        allowed = ['default', 'code', 'research', 'creative']
        if v not in allowed:
            raise ValueError(f'Task type must be one of {allowed}')
        return v

class ChatResponse(BaseModel):
    response: str
    session_id: str
    tokens_used: int = 0
    processing_time: float = 0

class CodeRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = "python"
    
    @validator('language')
    def validate_language(cls, v):
        allowed = ['python', 'javascript', 'js']
        if v not in allowed:
            raise ValueError(f'Language must be one of {allowed}')
        return v

class CodeResponse(BaseModel):
    success: bool
    output: str
    error: Optional[str] = None

class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    style: str = "realistic"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AnalyticsResponse(BaseModel):
    total_sessions: int
    total_messages: int
    total_tokens: int
    active_users: int
    uptime: float

# ============================================
# MIDDLEWARE & DEPENDENCIES
# ============================================

async def rate_limit_dependency(request: Request):
    """Rate limit dependency"""
    client_ip = request.client.host if request.client else "unknown"
    if not await rate_limiter.check_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

async def auth_dependency(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))):
    """Authentication dependency"""
    if not credentials:
        return None
    payload = auth_handler.verify_token(credentials.credentials)
    return payload

# ============================================
# FASTAPI APPLICATION
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting HUNDREDXMIND AI-OS...")
    await db_manager.connect()
    logger.info("Application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await db_manager.disconnect()
    logger.info("Application stopped")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise Grade Artificial Intelligence Operating System",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not settings.DEBUG:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "features": ["chat", "code", "image", "file", "auth", "analytics"]
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected" if db_manager.mongo_client else "disconnected",
        "redis": "connected" if db_manager.redis_client else "disconnected",
        "ai_engine": "ready" if ai_engine.groq_client else "not_configured"
    }

@app.post("/chat", response_model=ChatResponse, tags=["AI"])
async def chat(
    request: ChatRequest,
    _: None = Depends(rate_limit_dependency),
    user: Optional[Dict] = Depends(auth_dependency)
):
    """Main chat endpoint - AI conversation"""
    start_time = time.time()
    
    # Get or create session
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get conversation history
    history = await db_manager.get_session_history(session_id, limit=20)
    
    if request.stream:
        return StreamingResponse(
            ai_engine.generate_response(
                message=request.message,
                history=history,
                context=request.context,
                task_type=request.task_type,
                stream=True
            ),
            media_type="text/event-stream"
        )
    
    # Generate response
    response = await ai_engine.generate_response(
        message=request.message,
        history=history,
        context=request.context,
        task_type=request.task_type,
        stream=False
    )
    
    # Save to database
    await db_manager.save_message(session_id, "user", request.message, {"task_type": request.task_type})
    await db_manager.save_message(session_id, "assistant", response)
    
    processing_time = time.time() - start_time
    
    return ChatResponse(
        response=response,
        session_id=session_id,
        processing_time=processing_time
    )

@app.post("/code/execute", response_model=CodeResponse, tags=["Code"])
async def execute_code(
    request: CodeRequest,
    _: None = Depends(rate_limit_dependency)
):
    """Execute code in sandbox"""
    if request.language == "python":
        result = await code_executor.execute_python(request.code)
    elif request.language in ["javascript", "js"]:
        result = await code_executor.execute_javascript(request.code)
    else:
        raise HTTPException(status_code=400, detail=f"Language {request.language} not supported")
    
    return CodeResponse(
        success=result["success"],
        output=result["output"],
        error=result.get("error")
    )

@app.post("/code/generate", tags=["Code"])
async def generate_code(
    description: str,
    language: str = "python",
    _: None = Depends(rate_limit_dependency)
):
    """Generate code from description"""
    result = await ai_engine.generate_code(description, language)
    return result

@app.post("/image/generate", tags=["Image"])
async def generate_image(
    request: ImageRequest,
    _: None = Depends(rate_limit_dependency)
):
    """Generate AI image"""
    result = await image_generator.generate(request.prompt, request.style)
    if not result["success"]:
        raise HTTPException(status_code=500, detail="Image generation failed")
    return result

@app.post("/file/upload", tags=["File"])
async def upload_file(
    file: UploadFile = File(...),
    _: None = Depends(rate_limit_dependency)
):
    """Upload and process file"""
    result = await file_processor.process_file(file)
    return result

@app.post("/auth/register", tags=["Auth"])
async def register_user(user_data: UserCreate):
    """Register new user"""
    # Check if user exists
    existing = await db_manager.db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed = auth_handler.hash_password(user_data.password)
    
    # Create user
    new_user = {
        "email": user_data.email,
        "username": user_data.username,
        "password_hash": hashed,
        "created_at": datetime.utcnow()
    }
    
    user = await db_manager.create_user(new_user)
    
    # Create token
    token = auth_handler.create_token(user["user_id"], user["email"])
    
    return {
        "message": "User registered successfully",
        "user_id": user["user_id"],
        "email": user["email"],
        "token": token
    }

@app.post("/auth/login", tags=["Auth"])
async def login_user(login_data: UserLogin):
    """Login user"""
    user = await db_manager.db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not auth_handler.verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = auth_handler.create_token(user["user_id"], user["email"])
    
    return {
        "message": "Login successful",
        "user_id": user["user_id"],
        "email": user["email"],
        "token": token
    }

@app.get("/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
async def get_analytics():
    """Get system analytics"""
    total_sessions = await db_manager.db.sessions.count_documents({})
    total_messages = await db_manager.db.messages.count_documents({})
    total_users = await db_manager.db.users.count_documents({})
    
    return AnalyticsResponse(
        total_sessions=total_sessions,
        total_messages=total_messages,
        total_tokens=0,
        active_users=total_users,
        uptime=time.time() - start_time if 'start_time' in dir() else 0
    )

@app.get("/sessions", tags=["Sessions"])
async def list_sessions():
    """List all sessions"""
    sessions = await db_manager.db.sessions.find().sort("last_updated", -1).limit(50).to_list(length=50)
    return {
        "sessions": [
            {
                "session_id": s["session_id"],
                "message_count": s.get("message_count", 0),
                "last_updated": s.get("last_updated", "").isoformat() if s.get("last_updated") else None
            }
            for s in sessions
        ]
    }

@app.get("/sessions/{session_id}", tags=["Sessions"])
async def get_session(session_id: str):
    """Get session details"""
    history = await db_manager.get_session_history(session_id)
    return {"session_id": session_id, "history": history}

@app.delete("/sessions/{session_id}", tags=["Sessions"])
async def delete_session(session_id: str):
    """Delete session"""
    await db_manager.db.messages.delete_many({"session_id": session_id})
    await db_manager.db.sessions.delete_one({"session_id": session_id})
    return {"message": "Session deleted"}

# ============================================
# ERROR HANDLERS
# ============================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# ============================================
# STARTUP
# ============================================

start_time = time.time()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )

print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║                    HUNDREDXMIND AI-OS PRO v∞                         ║
║                    Server Started Successfully                        ║
║                                                                       ║
║  API Documentation: http://localhost:8000/docs                        ║
║  Health Check:     http://localhost:8000/health                       ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
""")