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
        "updated_at": doc.get("updated_at"),
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
            "updated_at": None,
        }
    )
    new_doc = await col.find_one({"_id": result.inserted_id})
    return message_helper(new_doc)

#--- NEW FUNCTION ADDED ---
from typing import Any, Dict, List
from bson import ObjectId
from datetime import datetime
from app.core.database import get_database

# ... existing constants and room_helper ...
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
        "updated_at": doc.get("updated_at"), # Add this
    }

# ... get_room_collection, get_message_collection ...
async def get_room_collection():
    db = get_database()
    return db[ROOMS_COLLECTION]


async def get_message_collection():
    db = get_database()
    return db[MESSAGES_COLLECTION]

# ... insert_room, find_room_by_id, find_direct_room ...
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

async def insert_message(room_id: str, sender_id: str, content: str, image_url: str = None):
    col = await get_message_collection()
    now = datetime.utcnow()
    result = await col.insert_one(
        {
            "room_id": ObjectId(room_id),
            "sender_id": ObjectId(sender_id),
            "content": content,
            "image_url": image_url,
            "created_at": now,
            "updated_at": None # Initialize as None
        }
    )
    new_doc = await col.find_one({"_id": result.inserted_id})
    return message_helper(new_doc)

# --- NEW FUNCTIONS ---

async def update_message(message_id: str, content: str):
    col = await get_message_collection()
    now = datetime.utcnow()
    try:
        oid = ObjectId(message_id)
    except:
        return None
        
    result = await col.find_one_and_update(
        {"_id": oid},
        {"$set": {"content": content, "updated_at": now}},
        return_document=True
    )
    return message_helper(result) if result else None

async def delete_message_from_db(message_id: str):
    col = await get_message_collection()
    try:
        oid = ObjectId(message_id)
    except:
        return False
    
    result = await col.delete_one({"_id": oid})
    return result.deleted_count > 0

async def get_message_by_id(message_id: str):
    col = await get_message_collection()
    try:
        oid = ObjectId(message_id)
    except:
        return None
    doc = await col.find_one({"_id": oid})
    return message_helper(doc) if doc else None

async def find_messages_for_room(room_id: str, limit: int = 50):
    col = await get_message_collection()
    cursor = (
        col.find({"room_id": ObjectId(room_id)})
        .sort("created_at", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [message_helper(d) for d in docs][::-1]

# ... existing imports ...

# Add this function to find rooms for a user
async def find_rooms_for_user(user_id: str):
    col = await get_room_collection()
    cursor = col.find({"participants": user_id})
    docs = await cursor.to_list(length=1000)
    return [room_helper(doc) for doc in docs]

async def mark_message_as_read(message_id: str, user_id: str):
    col = await get_message_collection()
    try:
        oid = ObjectId(message_id)
    except:
        return None
    
    # Add user_id to read_by set (avoids duplicates)
    result = await col.find_one_and_update(
        {"_id": oid},
        {"$addToSet": {"read_by": user_id}},
        return_document=True
    )
    return message_helper(result) if result else None