from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import uuid4, UUID

class User(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    username: str = Field(..., max_length=255)
    email: EmailStr
    password_hash: str = Field(..., max_length=255)
    messages: Optional[List[str]] = []  # Store message IDs or embed messages

    class Config:
        orm_mode = True
