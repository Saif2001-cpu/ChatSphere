from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List

from app.schemas.chat_schema import (
    ChatRoomCreate,
    ChatRoomInDB,
    ChatMessageCreate,
    ChatMessageInDB,
)
from app.core.security import get_current_user
from app.schemas.user_schema import UserInDB
from app.services.chat_service import (
    create_chat_room,
    get_messages,
    send_message,
    get_or_create_direct_room,
)

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.post("/rooms", response_model=ChatRoomInDB)
async def create_room(room_in: ChatRoomCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.id not in room_in.participants:
        room_in.participants.append(current_user.id)
    return await create_chat_room(room_in)

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import List
import shutil
import uuid
import os

# ... other imports ...

# Add to existing router
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/uploads/{file_name}"
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return the URL (Assuming running on localhost:8000)
    return {"url": f"http://localhost:8000/static/uploads/{file_name}"}

# ... existing routes ...

@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageInDB])
async def get_room_messages(
    room_id: str,
    limit: int = Query(50, ge=1, le=200),
    _: UserInDB = Depends(get_current_user),
):
    return await get_messages(room_id, limit)


@router.post("/rooms/{room_id}/messages", response_model=ChatMessageInDB)
async def post_message(
    room_id: str,
    message_in: ChatMessageCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    if room_id != message_in.room_id:
        raise HTTPException(status_code=400, detail="Room ID mismatch")
    return await send_message(room_id, current_user.id, message_in.content)


@router.post("/rooms/direct/{other_user_id}", response_model=ChatRoomInDB)
async def get_or_create_direct(
    other_user_id: str, current_user: UserInDB = Depends(get_current_user)
):
    room = await get_or_create_direct_room(current_user.id, other_user_id)
    return room
