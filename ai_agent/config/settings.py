import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PORT: int = int(os.getenv("AI_AGENT_PORT", "8001"))
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BACKEND_NODE_URL: str = os.getenv("BACKEND_NODE_URL", "http://localhost:3333")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
