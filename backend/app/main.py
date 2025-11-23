from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.routers import auth_router, user_router, chat_router
from app.websocket import chat_ws

#os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(title=settings.APP_NAME)

#app.mount("/static", StaticFiles(directory="static"), name="static")
# CORS

# --- FIXED CORS SETUP ---
origins = [
    "http://localhost:5173", 
    "http://localhost:5174",  # Local frontend
    "http://localhost:3000",  # Alternative local port
    "https://chatsphere-m3ynk0gjf-saif2001cpus-projects.vercel.app", # Your specific Vercel Deployment
    "https://chatsphere.vercel.app",
      # Your main Vercel Domain (if you have one)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(chat_router.router)
app.include_router(chat_ws.router)


@app.get("/")
async def root():
    return {"message": "Chat API is running"}
