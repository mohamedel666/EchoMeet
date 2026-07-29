import os
import sqlite3
import requests
import wave
import struct
import json
import time

API = "http://localhost:8000"
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "echo_meet.db"))

def create_dummy_wav(filename):
    # Create a 1-second silent mono WAV file
    sample_rate = 16000
    duration = 1.0  # seconds
    
    with wave.open(filename, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        
        # 16000 samples of silence (0)
        for _ in range(int(sample_rate * duration)):
            data = struct.pack('<h', 0)
            w.writeframesraw(data)
    print(f"Created dummy WAV: {filename}")

def setup_test_meeting():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    meeting_id = "test-meeting-1234"
    started_at = "2026-06-17T11:00:00.000Z"
    
    # Delete existing test meeting if any
    cursor.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
    
    # Insert new test meeting
    cursor.execute(
        "INSERT INTO meetings (id, room_name, started_at, created_at) VALUES (?, ?, ?, ?)",
        (meeting_id, "TestRoom", started_at, started_at)
    )
    conn.commit()
    conn.close()
    print(f"Setup test meeting: {meeting_id}")
    return meeting_id

def test_upload():
    meeting_id = setup_test_meeting()
    
    # Create wav files
    file1 = "test_audio1.wav"
    file2 = "test_audio2.wav"
    create_dummy_wav(file1)
    create_dummy_wav(file2)
    
    try:
        # First upload: Mohamed at t = 10s (10000 ms)
        # 2026-06-17T11:00:00.000Z in epoch ms is 1781773200000 (roughly, let's just use an arbitrary timestamp)
        started_at_epoch = int(time.time() * 1000)
        
        print("\n--- UPLOADING FIRST AUDIO ---")
        with open(file1, 'rb') as f:
            files = {'file': (file1, f, 'audio/wav')}
            data = {
                'meeting_id': meeting_id,
                'participant_name': 'Mohamed',
                'recording_started_at': str(started_at_epoch + 10000), # 10s after meeting start
                'duration': '1.0'
            }
            res = requests.post(f"{API}/analyze-audio", files=files, data=data)
            print("Status code:", res.status_code)
            res_json = res.json()
            print("Response success:", res_json.get("success"))
            print("Response speakers:", res_json.get("speakers"))
            print("Response speaker_segments:", res_json.get("speaker_segments"))
            
        # Second upload: Sarah at t = 15s (15000 ms)
        print("\n--- UPLOADING SECOND AUDIO ---")
        with open(file2, 'rb') as f:
            files = {'file': (file2, f, 'audio/wav')}
            data = {
                'meeting_id': meeting_id,
                'participant_name': 'Sarah',
                'recording_started_at': str(started_at_epoch + 15000), # 15s after meeting start
                'duration': '1.0'
            }
            res = requests.post(f"{API}/analyze-audio", files=files, data=data)
            print("Status code:", res.status_code)
            res_json = res.json()
            print("Response success:", res_json.get("success"))
            print("Response speakers:", res_json.get("speakers"))
            print("Response speaker_segments:", res_json.get("speaker_segments"))
            print("Response analysis summary:", res_json.get("analysis", {}).get("summary"))

        # Verify DB updates
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT analysis_json FROM meetings WHERE id = ?", (meeting_id,))
        row = cursor.fetchone()
        if row and row[0]:
            db_data = json.loads(row[0])
            print("\n--- VERIFYING DATABASE VALUES ---")
            print("DB segments count:", len(db_data.get("speaker_segments", [])))
            for seg in db_data.get("speaker_segments", []):
                print(f"Segment: {seg.get('speaker')} at {seg.get('absolute_start')} - text: {seg.get('text')}")
        conn.close()

    finally:
        # Cleanup dummy wav files
        if os.path.exists(file1):
            os.remove(file1)
        if os.path.exists(file2):
            os.remove(file2)

if __name__ == "__main__":
    test_upload()
