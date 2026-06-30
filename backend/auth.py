import hashlib
import os
import secrets
import time

import jwt

JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
_ALGORITHM = "HS256"
_EXPIRY_SECONDS = 7 * 24 * 3600


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${h.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    salt, stored = hashed.split("$", 1)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return secrets.compare_digest(stored, h.hex())


def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": time.time() + _EXPIRY_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=_ALGORITHM)


def decode_token(token: str) -> int:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[_ALGORITHM])
    return int(payload["sub"])
