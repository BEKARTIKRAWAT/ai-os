from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os

MONGODB_URL = "mongodb+srv://bekartikrawat:therawat02@cluster0.xxvuzys.mongodb.net/ai-os-db?appName=Cluster0"

client = AsyncIOMotorClient(MONGODB_URL)
db = client["ai-os-db"]

chats_collection = db["chats"]
users_collection = db["users"]

async def save_message(session_id: str, role: str, content: str, agent: str = "chat", tokens: int = 0):
    await chats_collection.insert_one({
        "session_id": session_id,
        "role": role,
        "content": content,
        "agent": agent,
        "tokens": tokens,
        "timestamp": datetime.utcnow()
    })

async def get_chat_history(session_id: str):
    cursor = chats_collection.find(
        {"session_id": session_id},
        sort=[("timestamp", 1)]
    )
    messages = []
    async for doc in cursor:
        messages.append({
            "role": doc["role"],
            "content": doc["content"],
            "agent": doc.get("agent", "chat"),
            "tokens": doc.get("tokens", 0),
            "timestamp": str(doc["timestamp"])
        })
    return messages

async def get_all_sessions():
    pipeline = [
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$last": "$content"},
            "last_time": {"$last": "$timestamp"},
            "message_count": {"$sum": 1}
        }},
        {"$sort": {"last_time": -1}}
    ]
    cursor = chats_collection.aggregate(pipeline)
    sessions = []
    async for doc in cursor:
        sessions.append({
            "session_id": doc["_id"],
            "last_message": doc["last_message"][:50] + "...",
            "last_time": str(doc["last_time"]),
            "message_count": doc["message_count"]
        })
    return sessions

async def delete_session(session_id: str):
    await chats_collection.delete_many({"session_id": session_id})