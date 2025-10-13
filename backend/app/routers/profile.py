from fastapi import APIRouter, Depends, File, HTTPException, status, UploadFile
from app.core.db import get_db
from app.core.security import get_current_user_id
from app.core.cloudinary import cloudinary
import cloudinary
import cloudinary.uploader
import os

router = APIRouter(tags=["profile"])

@router.patch("profile/image")
async def upload_profile_image(user_id: str,
          file: UploadFile = File(...), 
          db=Depends(get_db),
          current_user_id:str= Depends(get_current_user_id)
 ):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid image format")

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file.file, 
                                            folder="chat_app/profiles",
                                            public_id=f"profile_{current_user_id}",
                                            overwrite=True)
        
        image_url = result["url"]

        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to upload image")

        # Update user profile in DB
        await db["users"].update_one(
            {"_id": user_id},
            {"$set": {"profile_image": image_url}}
        )

        return {"image_url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")