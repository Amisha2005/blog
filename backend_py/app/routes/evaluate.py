from fastapi import APIRouter
# from pydantic import BaseModel
from app.services.evaluate_interview import evaluate_interview
# from app.models.schemas import ChatRequest


router = APIRouter(prefix="/api")




@router.post("/evaluate")
async def evaluate(req: dict):
    return await evaluate_interview(req)