from typing import Optional

from app.models.user_model import find_user_by_email, insert_user
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.schemas.user_schema import UserCreate, UserLogin, UserInDB, Token


async def register_user(user_in: UserCreate) -> UserInDB:
    existing = await find_user_by_email(user_in.email)
    if existing:
        raise ValueError("User with this email already exists")
    hashed = hash_password(user_in.password)
    user_doc = await insert_user(user_in.email, user_in.username, hashed)
    return UserInDB(**user_doc)


async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    user_doc = await find_user_by_email(email)
    if not user_doc:
        return None
    if not verify_password(password, user_doc["hashed_password"]):
        return None
    return UserInDB(**user_doc)


async def login_user(user_in: UserLogin) -> Token:
    user = await authenticate_user(user_in.email, user_in.password)
    if not user:
        raise ValueError("Invalid email or password")

    token = create_access_token({"sub": user.id})
    return Token(access_token=token)
