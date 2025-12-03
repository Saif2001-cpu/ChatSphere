from typing import Optional

from app.models.user_model import find_user_by_email, insert_user,update_last_login_salt
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

    # 1. Update the session salt (This invalidates all previous tokens)
    updated_user_doc = await update_last_login_salt(user.id)
    if not updated_user_doc:
        # Should ideally not happen if authenticate_user succeeded
        raise ValueError("Login failed due to user data update error")
    
    updated_user = UserInDB(**updated_user_doc)

    # 2. Create the token with the user ID ("sub") AND the new salt ("lid")
    token = create_access_token({
        "sub": updated_user.id,
        "lid": updated_user.last_login_salt # ADDED
    })
    return Token(access_token=token)