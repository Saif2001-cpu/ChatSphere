from fastapi import APIRouter, Depends, File, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from uuid import UUID,uuid4
from bson import ObjectId
from fastapi import FastAPI,UploadFile,Form
from dotenv import load_dotenv
load_dotenv()



from app.core.security import create_access_token
from app.core.db import get_db
from app.models.user import User

# Password hashing context — explicitly use argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Router instance
router = APIRouter(tags=["auth"])


# Pydantic models for request validation
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    request: RegisterRequest,
    db = Depends(get_db)
):
    username = request.username
    email = request.email
    password = request.password

    # Validate password is a string (Pydantic usually handles this, but safe to check)
    if not isinstance(password, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be a string"
        )

    # Check if email already exists
    existing_user = await db["users"].find_one({"email": email})

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )


    # Hash the password
    try:
        hashed_password = pwd_context.hash(password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to hash password"
        ) from e

    # Create new user
    user_doc = {
        "_id": str(uuid4()),
        "username": username,
        "email": email,
        "password_hash": hashed_password,
        "messages": []
    }
    await db["users"].insert_one(user_doc)

    return {
        "msg": "User registered successfully",
        "user_id": user_doc["_id"]
    }


@router.post("/login")
async def login(
    request: LoginRequest,
    db = Depends(get_db)
):
    email = request.email
    password = request.password

    # Fetch user
    user = await db["users"].find_one({"email": email})


    # Verify user and password
    if not user or not pwd_context.verify(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Generate JWT token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    #store the user[_id] in some other place to use it later
    
    return {
        "access_token": access_token,
        "user_id": user["_id"],
        "token_type": "bearer"
    }


print("Auth router loaded")