from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat
# from dotenv import load_dotenv
# import os

# load_dotenv()

# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)

@app.get("/")
def root():
    return {"message":"API running!!"}