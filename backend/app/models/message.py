from pydantic import BaseModel, Field
from uuid import uuid4, UUID
from datetime import datetime
from typing import List, Optional

message_doc = {
    "_id": str(uuid4()),
    "chat_id": chat_doc["_id"],
    "sender_id": user_a_id,
    "receiver_id": user_b_id,
    "content": "Hey there!",
    "timestamp": datetime.utcnow()
}
