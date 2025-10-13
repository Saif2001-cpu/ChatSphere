from pydantic import BaseModel, Field
from uuid import uuid4, UUID
from datetime import datetime

class ChatMessage(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    sender_id: UUID
    chat_room_id: UUID
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
