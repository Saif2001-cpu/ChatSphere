from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import SlowAPILimiter
from slowapi.middleware import SlowAPIMiddleware
import os
import redis

from app.core.config import settings
from app.routers import auth_router, user_router, chat_router
from app.websocket import chat_ws

#os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(title=settings.APP_NAME)

#app.mount("/static", StaticFiles(directory="static"), name="static")

# Add HTTPS redirect middleware in production
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Initialize rate limiter with Redis (or in-memory fallback)
try:
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    redis_client.ping()
    limiter = SlowAPILimiter(redis_client)
except redis.ConnectionError:
    # Fallback to in-memory rate limiting if Redis is not available
    from slowapi.limiter import MemoryRateLimiter
    limiter = SlowAPILimiter(MemoryRateLimiter())

app.state.limiter = limiter

# CORS

# --- SECURED CORS SETUP ---
# Only allow specific origins based on environment
if settings.ENVIRONMENT == "production":
    origins = [
        "https://chatsphere-m3ynk0gjf-saif2001cpus-projects.vercel.app",
        "https://chatsphere.vercel.app",
        "https://baat-cheet-ten.vercel.app",
    ]
else:
    # Development origins
    origins = [
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Restrict to necessary methods
    allow_headers=["Authorization", "Content-Type"],  # Only allow necessary headers
    expose_headers=["Content-Length"],
    max_age=600,  # Cache preflight results for 10 minutes
)

# Routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(chat_router.router)
app.include_router(chat_ws.router)


@app.get("/")
async def root():
    return {"message": "Chat API is running"}
