import os
import sqlite3
import json
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "echo_meet.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create meetings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        room_name TEXT NOT NULL,
        daily_room_url TEXT,
        started_at TEXT,
        ended_at TEXT,
        duration_seconds INTEGER,
        participant_count INTEGER DEFAULT 0,
        transcript TEXT,
        summary TEXT,
        action_items TEXT,
        analysis_json TEXT,
        created_at TEXT
    )
    ''')
    
    # Try to add analysis_json column in case table already exists
    try:
        cursor.execute("ALTER TABLE meetings ADD COLUMN analysis_json TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create settings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    ''')
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        password TEXT,
        created_at TEXT
    )
    ''')
    
    # Create peers table for cross-device peer signaling
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS peers (
        room_name TEXT PRIMARY KEY,
        peer_id TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        participant_name TEXT
    )
    ''')
    
    conn.commit()
    conn.close()

def dict_from_row(row):
    d = dict(row)
    # Parse JSON fields
    for key in ("transcript", "action_items", "analysis_json"):
        if key in d and d[key]:
            try:
                d[key] = json.loads(d[key])
            except:
                pass
    return d
