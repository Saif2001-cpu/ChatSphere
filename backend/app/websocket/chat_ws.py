from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

from app.utils.jwt import decode_token
from app.services.chat_service import send_message, edit_message, remove_message, mark_msg_read # Import mark_msg_read

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

    await websocket.accept()

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008)
        return

    user_id = payload["sub"]

    await manager.connect(room_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            
            action = data.get("type", "create")
            
            if action == "create":
                content = data.get("content")
                image_url = data.get("image_url")
                if not content and not image_url:
                    continue

                msg = await send_message(room_id, user_id, content or "", image_url)
                await manager.broadcast(
                    room_id,
                    {
                        "type": "create",
                        "id": msg.id,
                        "room_id": msg.room_id,
                        "sender_id": msg.sender_id,
                        "content": msg.content,
                        "image_url": msg.image_url,
                        "created_at": msg.created_at.isoformat(),
                        "updated_at": None,
                        "read_by": [] # New field
                    },
                )
            
            elif action == "edit":
                message_id = data.get("message_id")
                new_content = data.get("content")
                if message_id and new_content:
                    updated_msg = await edit_message(message_id, user_id, new_content)
                    if updated_msg:
                        await manager.broadcast(room_id, {
                            "type": "edit",
                            "id": updated_msg.id,
                            "content": updated_msg.content,
                            "updated_at": updated_msg.updated_at.isoformat() if updated_msg.updated_at else None
                        })

            elif action == "delete":
                message_id = data.get("message_id")
                if message_id:
                    success = await remove_message(message_id, user_id)
                    if success:
                        await manager.broadcast(room_id, {
                            "type": "delete",
                            "id": message_id
                        })
            
            # --- NEW: Handle Read Event ---
            elif action == "read":
                message_id = data.get("message_id")
                if message_id:
                    # Mark as read in DB
                    await mark_msg_read(message_id, user_id)
                    # Broadcast to room that THIS user read THIS message
                    await manager.broadcast(room_id, {
                        "type": "read_receipt",
                        "message_id": message_id,
                        "user_id": user_id
                    })
            
            elif action == "typing":
                await manager.broadcast(room_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "username": data.get("username")
                })
            
            elif action == "stop_typing":
                await manager.broadcast(room_id, {
                    "type": "stop_typing",
                    "user_id": user_id
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)