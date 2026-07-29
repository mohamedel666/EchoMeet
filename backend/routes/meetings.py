import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection, dict_from_row

router = APIRouter(prefix="/meetings", tags=["Meetings"])

# ── Schemas ───────────────────────────────────────────────────────────────────
class UserSignUpRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class CreateMeetingRequest(BaseModel):
    room_name: str

class SettingsItem(BaseModel):
    value: str

class UpdateMeetingRequest(BaseModel):
    ended_at: Optional[str] = None
    duration_seconds: Optional[int] = None
    participant_count: Optional[int] = None
    transcript: Optional[dict] = None
    summary: Optional[str] = None
    action_items: Optional[list] = None
    analysis_json: Optional[dict] = None

class RegisterPeerRequest(BaseModel):
    peer_id: str
    participant_name: Optional[str] = None

# ── Peer signaling routes ─────────────────────────────────────────────────────
@router.get("/peers/{room_name}")
def get_peer(room_name: str):
    """Get the peer ID for a room, excluding stale entries (older than 5 minutes)"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Clean up stale peers first (older than 5 minutes)
        five_minutes_ago = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
        cursor.execute("DELETE FROM peers WHERE updated_at < ?", (five_minutes_ago,))
        conn.commit()
        
        # Get the current peer for this room
        cursor.execute("SELECT peer_id, participant_name, updated_at FROM peers WHERE room_name = ?", (room_name,))
        row = cursor.fetchone()
        if row:
            peer_data = dict(row)
            # Check if peer is stale (older than 2 minutes)
            peer_time = datetime.fromisoformat(peer_data['updated_at'])
            if datetime.now(timezone.utc) - peer_time > timedelta(minutes=2):
                # Peer is stale, delete it and return None
                cursor.execute("DELETE FROM peers WHERE room_name = ?", (room_name,))
                conn.commit()
                return {"peer_id": None}
            return {"peer_id": peer_data['peer_id'], "participant_name": peer_data.get('participant_name')}
        return {"peer_id": None}
    finally:
        conn.close()

@router.post("/peers/{room_name}")
def register_peer(room_name: str, body: RegisterPeerRequest):
    """Register or update a peer for a room"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            "INSERT OR REPLACE INTO peers (room_name, peer_id, updated_at, participant_name) VALUES (?, ?, ?, ?)",
            (room_name, body.peer_id, now, body.participant_name)
        )
        conn.commit()
        return {"registered": True, "peer_id": body.peer_id}
    finally:
        conn.close()

@router.delete("/peers/{room_name}")
def delete_peer(room_name: str):
    """Delete a peer from a room"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM peers WHERE room_name = ?", (room_name,))
        conn.commit()
        return {"deleted": True}
    finally:
        conn.close()

# ── Settings routes ───────────────────────────────────────────────────────────
@router.get("/settings")
def get_all_settings():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM settings")
        rows = cursor.fetchall()
        return {row["key"]: row["value"] for row in rows}
    finally:
        conn.close()

@router.get("/settings/{key}")
def get_setting(key: str):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        if not row:
            return {"key": key, "value": None}
        return {"key": key, "value": row["value"]}
    finally:
        conn.close()

@router.post("/settings/{key}")
def set_setting(key: str, body: SettingsItem):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, body.value),
        )
        conn.commit()
    finally:
        conn.close()
    return {"status": "saved", "key": key, "value": body.value}

# ── Meeting CRUD routes ───────────────────────────────────────────────────────
@router.post("/create")
async def create_meeting(body: CreateMeetingRequest):
    meeting_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO meetings (id, room_name, started_at, created_at) VALUES (?, ?, ?, ?)",
            (meeting_id, body.room_name, now, now),
        )
        conn.commit()
    finally:
        conn.close()
    
    return {"meeting_id": meeting_id, "room_name": body.room_name}

@router.get("/")
def list_meetings():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meetings ORDER BY started_at DESC LIMIT 100")
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]
    finally:
        conn.close()

@router.get("/{meeting_id}")
def get_meeting(meeting_id: str):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return dict_from_row(row)
    finally:
        conn.close()

@router.patch("/{meeting_id}")
def update_meeting(meeting_id: str, body: UpdateMeetingRequest):
    updates = body.dict(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Prepare fields for SQLite
    for key in ("transcript", "action_items", "analysis_json"):
        if key in updates and updates[key] is not None:
            updates[key] = json.dumps(updates[key])
    
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [meeting_id]
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE meetings SET {set_clause} WHERE id = ?", values)
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Meeting not found")
    finally:
        conn.close()
    
    return {"status": "updated", "meeting_id": meeting_id}

# ── Auth routes ───────────────────────────────────────────────────────────────
@router.post("/auth/signup")
def auth_signup(body: UserSignUpRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Check if user already exists
        cursor.execute("SELECT email FROM users WHERE email = ?", (body.email.strip().lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            "INSERT INTO users (email, first_name, last_name, password, created_at) VALUES (?, ?, ?, ?, ?)",
            (body.email.strip().lower(), body.first_name.strip(), body.last_name.strip(), body.password, now)
        )
        conn.commit()
        return {"success": True, "message": "User registered successfully"}
    finally:
        conn.close()

@router.post("/auth/login")
def auth_login(body: UserLoginRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Find user
        cursor.execute("SELECT * FROM users WHERE email = ?", (body.email.strip().lower(),))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Email not found. Please sign up first.")
        
        user = dict(row)
        if user["password"] != body.password:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
            
        return {
            "success": True,
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"]
        }
    finally:
        conn.close()
