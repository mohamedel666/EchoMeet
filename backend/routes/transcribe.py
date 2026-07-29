from fastapi import APIRouter

router = APIRouter(prefix="/transcribe", tags=["transcribe"])


@router.post("/{meeting_id}")
def transcribe_meeting(meeting_id: str):
    """Stub: real transcription pipeline to be implemented."""
    return {"status": "pending", "meeting_id": meeting_id}
