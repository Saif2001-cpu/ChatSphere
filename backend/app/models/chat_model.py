from typing import Any, Dict, List
from bson import ObjectId
from datetime import datetime

from app.core.database import get_database

ROOMS_COLLECTION = "chat_rooms"
MESSAGES_COLLECTION = "chat_messages"


def room_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "is_group": doc.get("is_group", False),
        "participants": doc.get("participants", []),
    }


def message_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "room_id": str(doc["room_id"]),
        "sender_id": str(doc["sender_id"]),
        "image_url": doc.get("image_url"),
        "content": doc["content"],
        "created_at": doc["created_at"],
    }


async def get_room_collection():
    db = get_database()
    return db[ROOMS_COLLECTION]


async def get_message_collection():
    db = get_database()
    return db[MESSAGES_COLLECTION]


async def insert_room(name: str | None, is_group: bool, participants: List[str]):
    col = await get_room_collection()
    result = await col.insert_one(
        {
            "name": name,
            "is_group": is_group,
            "participants": participants,
        }
    )
    new_doc = await col.find_one({"_id": result.inserted_id})
    return room_helper(new_doc)


async def find_room_by_id(room_id: str):
    col = await get_room_collection()
    try:
        oid = ObjectId(room_id)
    except Exception:
        return None
    doc = await col.find_one({"_id": oid})
    return room_helper(doc) if doc else None


async def find_direct_room(user1_id: str, user2_id: str):
    col = await get_room_collection()
    participants_set = {user1_id, user2_id}
    doc = await col.find_one(
        {"is_group": False, "participants": {"$all": list(participants_set), "$size": 2}}
    )
    return room_helper(doc) if doc else None


async def insert_message(room_id: str, sender_id: str, content: str, image_url: str  = None):
    col = await get_message_collection()
    now = datetime.utcnow()
    result = await col.insert_one(
        {
            "room_id": ObjectId(room_id),
            "sender_id": ObjectId(sender_id),
            "content": content,
            "image_url": image_url,
            "created_at": now,
        }
    )
    new_doc = await col.find_one({"_id": result.inserted_id})
    return message_helper(new_doc)


async def find_messages_for_room(room_id: str, limit: int = 50):
    col = await get_message_collection()
    cursor = (
        col.find({"room_id": ObjectId(room_id)})
        .sort("created_at", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [message_helper(d) for d in docs][::-1]
