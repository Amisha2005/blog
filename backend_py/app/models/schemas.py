from pydantic import BaseModel

class ChatRequest(BaseModel):
    chat: str
    topic: str
    difficulty: str = "Medium"
    duration: int | None = None   # ADD THIS
    sessionId: str
    resumeText: str = ""