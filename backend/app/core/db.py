from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import DATABASE_URL

client = AsyncIOMotorClient(DATABASE_URL)
db = client.get_default_database()  # or client["your_db_name"]

# ✅ This is the function your app is trying to import
async def get_db():
    return db

