from typing import Dict, List
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self,chat_id:str,websocket:WebSocket):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        self.active_connections[chat_id].append(websocket)

    def disconnect(self,chat_id:str,websocket:WebSocket):
        self.active_connections[chat_id].remove(websocket)
    
    async def broadcast(self,chat_id:str,message:str):
            connections = self.active_connections.get(chat_id, [])
            for connection in connections:
                await connection.send_text(message)