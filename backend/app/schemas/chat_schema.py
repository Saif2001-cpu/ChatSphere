from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatMessageCreate(BaseModel):
    room_id: str
    content: str = Field(..., min_length=1)


class ChatMessageInDB(BaseModel):
    id: str
    room_id: str
    sender_id: str
    content: str
    created_at: datetime


class ChatRoomCreate(BaseModel):
    name: Optional[str] = None
    is_group: bool = False
    participants: List[str]


class ChatRoomInDB(BaseModel):
    id: str
    name: Optional[str] = None
    is_group: bool = False
    participants: List[str]


class ChatRoomPublic(ChatRoomInDB):
    pass
