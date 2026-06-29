import os
from contextlib import asynccontextmanager
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ai import ChatTurn, get_chat_response
from database import init_db

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


@app.post("/api/chat", response_model=ChatTurn)
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    return get_chat_response(messages)


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
