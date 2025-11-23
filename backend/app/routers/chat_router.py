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
    get_user_rooms
)

router = APIRouter(prefix="/chats", tags=["Chats"])

# --- UPLOAD ENDPOINT ---
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Configure Cloudinary
    cloudinary.config( 
        cloud_name = settings.CLOUDINARY_CLOUD_NAME, 
        api_key = settings.CLOUDINARY_API_KEY, 
        api_secret = settings.CLOUDINARY_API_SECRET 
    )
    
    # Upload file to Cloudinary
    result = cloudinary.uploader.upload(file.file, resource_type="auto")
    
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
    
    # FIX: Pass image_url to the service
    return await send_message(
        room_id, 
        current_user.id, 
        message_in.content, 
        message_in.image_url
    )