from fastapi import APIRouter, Depends, HTTPException
from app.core.db import get_db
from datetime import datetime
import uuid

router = APIRouter(prefix="/chat", tags=["Chat REST"])

# 1️⃣ Create Chat Room (you can also auto-generate)
@router.post("/create")
async def create_chat():
    new_chat_id = str(uuid.uuid4())
    return {"chat_id": new_chat_id, "message": "Chat room created successfully"}

# 2️⃣ Get Messages for a Chat Room
@router.get("/messages/{chat_id}")
async def get_messages(chat_id: str, db = Depends(get_db)):
    try:
        messages_cursor = db["chat_messages"].find(
            {"chat_room_id": chat_id}
            ).sort("timestamp", 1)
        
        messages = await messages_cursor.to_list(length=100)
        return [
            {
                "id": msg.get("_id"),
                "sender_id": str(msg.get("sender_id")),
                "content": msg.get("content"),
                "timestamp": msg.get("timestamp").isoformat()
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
