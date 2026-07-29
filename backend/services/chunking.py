from typing import List

def split_transcript(
    transcript: str,
    chunk_size: int = 500,
    overlap: int = 100
) -> List[str]:
    """
    Split transcript into overlapping chunks.
    """

    transcript = transcript.strip()

    if not transcript:
        return []

    chunks = []

    start = 0

    while start < len(transcript):
        end = start + chunk_size

        chunks.append(transcript[start:end])

        start += chunk_size - overlap

    return chunks