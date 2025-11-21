from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

from app.utils.jwt import decode_token
from app.services.chat_service import send_message

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/chat/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    # 1️⃣ Accept connection ONCE
    await websocket.accept()

    # 2️⃣ Validate JWT via query param
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008)
        return

    user_id = payload["sub"]

    # 3️⃣ Add connection to room
    await manager.connect(room_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content")
            image_url = data.get("image_url")
            if not content:
                continue

            msg = await send_message(room_id, user_id, content, image_url)
            await manager.broadcast(
                room_id,
                {
                    "id": msg.id,
                    "room_id": msg.room_id,
                    "sender_id": msg.sender_id,
                    "content": msg.content,
                    "image_url": msg.image_url,
                    "created_at": msg.created_at.isoformat(),
                },
            )

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
