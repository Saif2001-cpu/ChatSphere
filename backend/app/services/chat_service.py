from typing import List

from app.models.chat_model import (
    insert_room,
    find_room_by_id,
    find_direct_room,
    insert_message,
    find_messages_for_room,
)
from app.schemas.chat_schema import ChatRoomInDB, ChatRoomCreate, ChatMessageInDB


async def create_chat_room(room_in: ChatRoomCreate) -> ChatRoomInDB:
    doc = await insert_room(room_in.name, room_in.is_group, room_in.participants)
    return ChatRoomInDB(**doc)


async def get_room(room_id: str) -> ChatRoomInDB | None:
    doc = await find_room_by_id(room_id)
    return ChatRoomInDB(**doc) if doc else None


async def get_or_create_direct_room(user1_id: str, user2_id: str) -> ChatRoomInDB:
    doc = await find_direct_room(user1_id, user2_id)
    if doc:
        return ChatRoomInDB(**doc)
    doc = await insert_room(
        name=None, is_group=False, participants=[user1_id, user2_id]
    )
    return ChatRoomInDB(**doc)


async def send_message(room_id: str, sender_id: str, content: str ,image_url: str = None) -> ChatMessageInDB:
    doc = await insert_message(room_id, sender_id, content ,image_url)
    return ChatMessageInDB(**doc)


async def get_messages(room_id: str, limit: int = 50) -> List[ChatMessageInDB]:
    docs = await find_messages_for_room(room_id, limit)
    return [ChatMessageInDB(**d) for d in docs]
