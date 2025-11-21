from fastapi import APIRouter, Depends
from typing import List

from app.schemas.user_schema import UserPublic, UserInDB
from app.core.security import get_current_user
from app.services.user_service import list_users, search_users
from app.services.friend_services import add_friend, remove_friend  

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return UserPublic(id=current_user.id, email=current_user.email, username=current_user.username)


@router.get("/", response_model=List[UserPublic])
async def get_users(_: UserInDB = Depends(get_current_user)):
    return await list_users()


@router.get("/search", response_model=List[UserPublic])
async def search(q: str, _: UserInDB = Depends(get_current_user)):
    return await search_users(q)

@router.post("/add-friend/{friend_id}")
async def add_friend_route(friend_id: str, current_user: UserInDB = Depends(get_current_user)):
    await add_friend(current_user.id, friend_id)
    return {"message": "Friend added successfully"}

@router.delete("/remove-friend/{friend_id}")
async def remove_friend_route(friend_id: str, current_user: UserInDB = Depends(get_current_user)):
    await remove_friend(current_user.id, friend_id)
    return {"message": "Friend removed successfully"}

@router.get("/friends")
async def get_friends(current_user: UserInDB = Depends(get_current_user)):
    return current_user.friends

