import json
import os
from contextlib import asynccontextmanager
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ai import ChatTurn, get_chat_response
from database import init_db

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CATALOG_PATH = os.path.join(ROOT_DIR, "catalog.json")
TEMPLATES_DIR = os.path.join(ROOT_DIR, "templates")


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
    document_type: str = "mutual-nda"


def _doc_id(filename: str) -> str:
    """Derive document type ID from catalog filename, e.g. 'templates/CSA.md' -> 'csa'."""
    stem = os.path.splitext(os.path.basename(filename))[0]
    return stem.lower()


@app.get("/api/catalog")
async def catalog():
    with open(CATALOG_PATH) as f:
        entries = json.load(f)
    for entry in entries:
        entry["id"] = _doc_id(entry["filename"])
    return entries


@app.get("/api/templates/{filename}", response_class=PlainTextResponse)
async def template(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Template not found")
    with open(path, encoding="utf-8") as f:
        return f.read()


@app.post("/api/chat", response_model=ChatTurn)
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    return get_chat_response(messages, req.document_type)


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
