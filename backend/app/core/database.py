from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(str(settings.MONGO_URI))
    return _client


def get_database() -> AsyncIOMotorDatabase:
    client = get_client()
    return client[settings.MONGO_DB_NAME]
