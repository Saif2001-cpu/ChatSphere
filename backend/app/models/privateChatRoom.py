from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4, UUID

class ChatRoom(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., max_length=255)
    messages: Optional[List[str]] = []  # Store message IDs or embed messages
    
    class Config:
        orm_mode = True