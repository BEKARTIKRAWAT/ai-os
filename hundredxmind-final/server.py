from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "HundredXMind AI-OS Running"}

@app.post("/chat")
def chat(data: dict):
    msg = data.get("message", "")
    return {"response": f"You said: {msg}", "session_id": "test"}