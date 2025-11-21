from typing import List, Optional

from app.models.user_model import find_user_by_id, find_user_by_email, get_user_collection
from app.schemas.user_schema import UserInDB, UserPublic


async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    doc = await find_user_by_id(user_id)
    return UserInDB(**doc) if doc else None


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    doc = await find_user_by_email(email)
    return UserInDB(**doc) if doc else None


async def list_users() -> List[UserPublic]:
    col = await get_user_collection()
    cursor = col.find({})
    docs = await cursor.to_list(length=1000)
    users = [
        UserPublic(id=str(d["_id"]), email=d["email"], username=d["username"])
        for d in docs
    ]
    return users


async def search_users(query: str) -> List[UserPublic]:
    col = await get_user_collection()
    cursor = col.find({"username": {"$regex": query, "$options": "i"}})
    docs = await cursor.to_list(length=100)
    users = [
        UserPublic(id=str(d["_id"]), email=d["email"], username=d["username"])
        for d in docs
    ]
    return users
