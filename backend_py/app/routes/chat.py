from fastapi import APIRouter
from pydantic import BaseModel
from app.services.chat_service import handle_chat
from app.models.schemas import ChatRequest

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    chat: str
    topic: str
    difficulty: str = "Medium"
    sessionId: str
    resumeText: str = ""

@router.post("/chat")
async def chat(req: ChatRequest):
    return await handle_chat(req)