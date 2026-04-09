from fastapi import APIRouter

router = APIRouter(prefix="/api/auth")

@router.post("/login")
def login():
    return {"message": "login"}