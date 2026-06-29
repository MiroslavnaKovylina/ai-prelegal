import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "prelegal.db")


def init_db() -> None:
    """Create the database and tables from scratch."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)
