import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mongodb+srv://maif95689_db_user:PtUNGmlrNsSq897M@cluster0.ijksmgf.mongodb.net/ChatSphere?retryWrites=true&w=majority&appName=Cluster0")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

