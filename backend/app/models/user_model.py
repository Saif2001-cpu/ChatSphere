from typing import Any, Dict
from bson import ObjectId

from app.core.database import get_database

USERS_COLLECTION = "users"


def user_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "username": doc["username"],
        "hashed_password": doc["hashed_password"],
        "friends": doc.get("friends", []),
    }


async def get_user_collection():
    db = get_database()
    return db[USERS_COLLECTION]


async def find_user_by_email(email: str):
    col = await get_user_collection()
    doc = await col.find_one({"email": email})
    return user_helper(doc) if doc else None


async def find_user_by_id(user_id: str):
    col = await get_user_collection()
    try:
        oid = ObjectId(user_id)
    except Exception:
        return None
    doc = await col.find_one({"_id": oid})
    return user_helper(doc) if doc else None


async def insert_user(email: str, username: str, hashed_password: str) -> Dict[str, Any]:
    col = await get_user_collection()
    result = await col.insert_one(
        {"email": email, "username": username, "hashed_password": hashed_password, "friends": []}
    )
    new_doc = await col.find_one({"_id": result.inserted_id})
    return user_helper(new_doc)
