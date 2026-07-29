import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import meetings, transcribe, summarize, audio_processor
from database import init_db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize Database
try:
    init_db()
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Error initializing database: {e}")

app = FastAPI(title="Echo Meet API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
# CORS configuration - allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(meetings.router)
app.include_router(transcribe.router)
app.include_router(summarize.router)
app.include_router(audio_processor.router)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok", 
        "database": "SQLite (Local)",
        "api_keys": {
            "gemini": "configured" if os.getenv("GEMINI_API_KEY") else "missing",
            "huggingface": "configured" if os.getenv("HUGGINGFACE_TOKEN") else "missing"
        }
    }
