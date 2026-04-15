from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat
from app.routes import evaluate
from dotenv import load_dotenv
import os

load_dotenv()

# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(evaluate.router)

@app.get("/")
def root():
    return {"message":"API running!!"}