from bson import ObjectId
from app.core.database import get_database

async def add_friend(user_id: str, friend_id: str):
    db = get_database()
    users = db["users"]

    await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"friends": friend_id}}
    )

    await users.update_one(
        {"_id": ObjectId(friend_id)},
        {"$addToSet": {"friends": user_id}}
    )

    return True


async def remove_friend(user_id: str, friend_id: str):
    db = get_database()
    users = db["users"]

    await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"friends": friend_id}}
    )

    await users.update_one(
        {"_id": ObjectId(friend_id)},
        {"$pull": {"friends": user_id}}
    )

    return True
