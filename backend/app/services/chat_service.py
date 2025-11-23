from typing import List

from app.models.chat_model import (
    insert_room,
    find_room_by_id,
    find_direct_room,
    insert_message,
    find_messages_for_room,
    update_message,
    delete_message_from_db,
    get_message_by_id,
    find_rooms_for_user
)
from app.schemas.chat_schema import ChatRoomInDB, ChatRoomCreate, ChatMessageInDB
from fastapi import HTTPException

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

async def get_user_rooms(user_id: str) -> List[ChatRoomInDB]:
    docs = await find_rooms_for_user(user_id)
    return [ChatRoomInDB(**d) for d in docs]

async def send_message(room_id: str, sender_id: str, content: str ,image_url: str = None) -> ChatMessageInDB:
    doc = await insert_message(room_id, sender_id, content ,image_url)
    return ChatMessageInDB(**doc)


async def get_messages(room_id: str, limit: int = 50) -> List[ChatMessageInDB]:
    docs = await find_messages_for_room(room_id, limit)
    return [ChatMessageInDB(**d) for d in docs]

async def edit_message(message_id: str, user_id: str, new_content: str) -> Optional[ChatMessageInDB]:
    # 1. Fetch message to verify owner
    msg = await get_message_by_id(message_id)
    if not msg:
        return None
    
    if msg["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this message")
    
    # 2. Update
    updated_doc = await update_message(message_id, new_content)
    return ChatMessageInDB(**updated_doc) if updated_doc else None

async def remove_message(message_id: str, user_id: str) -> bool:
    # 1. Fetch message to verify owner
    msg = await get_message_by_id(message_id)
    if not msg:
        return False
    
    if msg["sender_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    # 2. Delete
    return await delete_message_from_db(message_id)
