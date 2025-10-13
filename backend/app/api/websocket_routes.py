from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: str):
    await websocket.accept()
    await websocket.send_text(f"Connected to chat {chat_id}")
