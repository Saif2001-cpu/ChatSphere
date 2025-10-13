from fastapi import FastAPI,APIRouter,WebSocket
from app.api.chat_rest import router as chat_rest_router
from app.core.db import get_db,db
from app.api.auth import router as auth_router
from app.services.websocket_manager import WebSocketManager
from app.api.websocket_routes import router as websocket_router
from app.models import user
import uvicorn
from app.core.db import db
from fastapi.middleware.cors import CORSMiddleware
from app.api import privateChats

app = FastAPI()

router = APIRouter()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(websocket_router)



@app.on_event("startup")
async def startup_event():
    try:
        await db.command("ping")
        print("\033[92mMongoDB connection successful\033[0m")
    except Exception as e:
        print(f"\033[91mError connecting to MongoDB: {e}\033[0m")

#include the auth router
app.include_router(auth_router, prefix="/auth")

app.include_router(privateChats.router, prefix="/chats")

@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)