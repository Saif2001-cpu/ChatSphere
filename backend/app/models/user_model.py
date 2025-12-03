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
        "last_login_salt": doc.get("last_login_salt"),
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

# --- NEW FUNCTION FOR SESSION MANAGEMENT ---
async def update_last_login_salt(user_id: str):
    """Generates a new salt/session ID and updates the user record."""
    col = await get_user_collection()
    new_salt = str(ObjectId())
    
    # We update the salt and return the updated document.
    updated_doc = await col.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"last_login_salt": new_salt}},
        return_document=True # Important: return the updated doc
    )
    
    return user_helper(updated_doc) if updated_doc else None