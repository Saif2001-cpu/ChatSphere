from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.db import get_db
from uuid import uuid4
from datetime import datetime

router = APIRouter(tags=["chats"])

class ChatCreate(BaseModel):
    name: str


@router.get("/search-user")
async def search_user(query: str, db=Depends(get_db)):
    user = await db["users"].find_one({
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}}
        ]
    })
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user["_id"],
        "username": user["username"],
        "email": user["email"]
    }


@router.post("/start-chat")
async def start_chat(sender_id: str, receiver_id: str, db=Depends(get_db)):
    existing = await db["private_chats"].find_one({
        "participants": {"$all": [sender_id, receiver_id]}
    })
    if existing:
        return {"chat_id": existing["_id"]}
    
    chat_doc = {
        "_id": str(uuid4()),
        "participants": [sender_id, receiver_id],
        "created_at": datetime.utcnow()
    }
    await db["private_chats"].insert_one(chat_doc)
    return {"chat_id": chat_doc["_id"]}

@router.post("/send-message")
async def send_message(chat_id: str, sender_id: str, receiver_id: str, content: str, db=Depends(get_db)):
    message_doc = {
        "_id": str(uuid4()),
        "chat_id": chat_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "timestamp": datetime.utcnow()
    }
    await db["private_messages"].insert_one(message_doc)
    return {"msg": "Message sent"}

@router.get("/messages/{chat_id}")
async def get_messages(chat_id: str, db=Depends(get_db)):
    cursor = db["private_messages"].find({"chat_id": chat_id}).sort("timestamp", 1)
    messages = await cursor.to_list(length=100)
    return messages
