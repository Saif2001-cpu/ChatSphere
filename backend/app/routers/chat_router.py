from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import List
import shutil
import uuid
import os
import cloudinary
import cloudinary.uploader

from app.core.config import settings
from app.core.security import get_current_user
from app.schemas.user_schema import UserInDB
from app.schemas.chat_schema import (
    ChatRoomCreate,
    ChatRoomInDB,
    ChatMessageCreate,
    ChatMessageInDB,
)
from app.services.chat_service import (
    create_chat_room,
    get_messages,
    send_message,
    get_or_create_direct_room,
    get_user_rooms,
    get_room
)

router = APIRouter(prefix="/chats", tags=["Chats"])

# Allowed file extensions and max size (5MB)
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# --- UPLOAD ENDPOINT ---
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate file extension
    if not file.filename or '.' not in file.filename:
        raise HTTPException(status_code=400, detail="Invalid file name")
    
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB")
    
    # Reset file pointer for Cloudinary upload
    from io import BytesIO
    file.file = BytesIO(content)
    
    # Configure Cloudinary
    cloudinary.config( 
        cloud_name = settings.CLOUDINARY_CLOUD_NAME, 
        api_key = settings.CLOUDINARY_API_KEY, 
        api_secret = settings.CLOUDINARY_API_SECRET 
    )
    
    # Upload file to Cloudinary with explicit resource type
    result = cloudinary.uploader.upload(file.file, resource_type="image", folder="chat_uploads")
    
    # Return the secure URL
    return {"url": result.get("secure_url")}


# --- ROOM ENDPOINTS ---
@router.post("/rooms", response_model=ChatRoomInDB)
async def create_room(room_in: ChatRoomCreate, current_user: UserInDB = Depends(get_current_user)):
    if current_user.id not in room_in.participants:
        room_in.participants.append(current_user.id)
    return await create_chat_room(room_in)


# Add this endpoint to list user's rooms
@router.get("/rooms", response_model=List[ChatRoomInDB])
async def get_my_rooms(current_user: UserInDB = Depends(get_current_user)):
    return await get_user_rooms(current_user.id)

@router.post("/rooms/direct/{other_user_id}", response_model=ChatRoomInDB)
async def get_or_create_direct(
    other_user_id: str, current_user: UserInDB = Depends(get_current_user)
):
    room = await get_or_create_direct_room(current_user.id, other_user_id)
    return room


# --- MESSAGE ENDPOINTS ---
@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageInDB])
async def get_room_messages(
    room_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: UserInDB = Depends(get_current_user),
):
    # Verify user is a participant of the room
    room = await get_room(room_id)
    if not room or current_user.id not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized to access this room")
    return await get_messages(room_id, limit)


@router.post("/rooms/{room_id}/messages", response_model=ChatMessageInDB)
async def post_message(
    room_id: str,
    message_in: ChatMessageCreate,
    current_user: UserInDB = Depends(get_current_user),
):
    if room_id != message_in.room_id:
        raise HTTPException(status_code=400, detail="Room ID mismatch")
    
    # FIX: Pass image_url to the service
    return await send_message(
        room_id, 
        current_user.id, 
        message_in.content, 
        message_in.image_url
    )