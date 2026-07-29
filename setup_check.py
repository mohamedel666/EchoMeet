import os
import sys
from dotenv import load_dotenv

def check_setup():
    load_dotenv(os.path.join("backend", ".env"))
    
    print("=== Echo Meet Setup Check ===\n")
    
    # 1. Check Python dependencies
    print("[1] Checking dependencies...")
    try:
        import fastapi
        import whisper
        import torch
        print("  - Core libraries: OK")
    except ImportError as e:
        print(f"  - Missing library: {e}")
        print("    Action: Run 'pip install -r backend/requirements.txt'")

    # 2. Check FFmpeg
    print("\n[2] Checking FFmpeg...")
    ffmpeg_check = os.system("ffmpeg -version > nul 2>&1" if os.name == 'nt' else "ffmpeg -version > /dev/null 2>&1")
    if ffmpeg_check == 0:
        print("  - FFmpeg: OK")
    else:
        print("  - FFmpeg: NOT FOUND")
        print("    Action: Install FFmpeg and add it to your PATH.")

    # 3. Check API Keys
    print("\n[3] Checking API Keys in backend/.env...")
    gemini = os.getenv("GEMINI_API_KEY")
    hf = os.getenv("HUGGINGFACE_TOKEN")
    
    if gemini:
        print("  - Gemini API Key: CONFIGURED")
    else:
        print("  - Gemini API Key: MISSING")
        print("    Action: Get one from https://aistudio.google.com/")

    if hf:
        print("  - Hugging Face Token: CONFIGURED")
    else:
        print("  - Hugging Face Token: MISSING")
        print("    Action: Get one from https://huggingface.co/settings/tokens")
        print("    Note: You must also accept conditions for 'pyannote/speaker-diarization-3.0' on Hugging Face.")

    print("\n[4] Database Status:")
    print("  - System is now using SQLite (local file: backend/echo_meet.db)")
    print("  - No external database setup required!")

    print("\n==============================")
    if gemini and hf and ffmpeg_check == 0:
        print("STATUS: READY TO RUN!")
    else:
        print("STATUS: NEEDS CONFIGURATION (see actions above)")

if __name__ == "__main__":
    check_setup()
