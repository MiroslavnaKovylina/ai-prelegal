import json
import os
from contextlib import asynccontextmanager
from typing import Annotated, Literal

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ai import ChatTurn, get_chat_response
from auth import create_token, decode_token, hash_password, verify_password
from database import get_connection, init_db

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CATALOG_PATH = os.path.join(ROOT_DIR, "catalog.json")
TEMPLATES_DIR = os.path.join(ROOT_DIR, "templates")

_bearer = HTTPBearer()


def _get_user_id(creds: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)]) -> int:
    try:
        return decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

# ── Auth ─────────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    email: str


@app.post("/api/auth/register", response_model=AuthResponse)
async def register(req: AuthRequest):
    with get_connection() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (req.email, hash_password(req.password)),
        )
        conn.commit()
        user = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    return AuthResponse(token=create_token(user["id"]), email=req.email)


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: AuthRequest):
    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (req.email,)
        ).fetchone()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(token=create_token(user["id"]), email=req.email)


# ── Catalog & templates ───────────────────────────────────────────────────────

def _doc_id(filename: str) -> str:
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


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    document_type: str
    catalog_name: str
    fields: dict = {}
    messages: list = []


class DocumentUpdate(BaseModel):
    fields: dict = {}
    messages: list = []


def _row_to_doc(row) -> dict:
    return {
        "id": row["id"],
        "document_type": row["document_type"],
        "catalog_name": row["catalog_name"],
        "fields": json.loads(row["fields"]),
        "messages": json.loads(row["messages"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@app.get("/api/documents")
async def list_documents(user_id: Annotated[int, Depends(_get_user_id)]):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
    return [_row_to_doc(r) for r in rows]


@app.post("/api/documents", status_code=201)
async def create_document(
    req: DocumentCreate,
    user_id: Annotated[int, Depends(_get_user_id)],
):
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO documents (user_id, document_type, catalog_name, fields, messages)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, req.document_type, req.catalog_name,
             json.dumps(req.fields), json.dumps(req.messages)),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,)
        ).fetchone()
    return _row_to_doc(row)


@app.put("/api/documents/{doc_id}")
async def update_document(
    doc_id: int,
    req: DocumentUpdate,
    user_id: Annotated[int, Depends(_get_user_id)],
):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        conn.execute(
            """UPDATE documents SET fields = ?, messages = ?,
               updated_at = CURRENT_TIMESTAMP WHERE id = ?""",
            (json.dumps(req.fields), json.dumps(req.messages), doc_id),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    return _row_to_doc(updated)


@app.delete("/api/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: int,
    user_id: Annotated[int, Depends(_get_user_id)],
):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()


# ── Chat ──────────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    document_type: str = "mutual-nda"


@app.post("/api/chat", response_model=ChatTurn)
async def chat(req: ChatRequest, user_id: Annotated[int, Depends(_get_user_id)]):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    return get_chat_response(messages, req.document_type)


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
