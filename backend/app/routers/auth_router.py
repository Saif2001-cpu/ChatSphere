from fastapi import APIRouter, HTTPException, status, Request
from slowapi import SlowAPILimiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import redis
from app.schemas.user_schema import UserCreate, UserLogin, Token, UserPublic
from app.services.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(request: Request, user_in: UserCreate):
    try:
        user = await register_user(user_in)
        return UserPublic(id=user.id, email=user.email, username=user.username)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
async def login(request: Request, user_in: UserLogin):
    try:
        token = await login_user(user_in)
        return token
    except ValueError as e:
        # Generic error message to prevent user enumeration
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
