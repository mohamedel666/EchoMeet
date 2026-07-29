import os
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/summarize", tags=["summarize"])


@router.post("/{meeting_id}")
def summarize_meeting(meeting_id: str):
    """Stub: real summarization pipeline to be implemented."""
    return {"status": "pending", "meeting_id": meeting_id}


class SummarizeTextRequest(BaseModel):
    transcript: str = Field(min_length=1)


class SummarizeTextResponse(BaseModel):
    provider: Literal["openai", "anthropic", "none"]
    model: Optional[str] = None
    report: str


_PROMPT_TEMPLATE = """You are an advanced AI assistant specialized in analyzing meeting transcripts.

Your task is to carefully read the full transcript of a meeting and generate a structured, clear, and professional report.

You MUST extract and present the following sections:

1. 📌 Meeting Summary
Provide a concise summary of the entire meeting in 5–8 sentences.

2. 🧠 Key Discussion Points
List the main topics and ideas that were discussed.

3. ✅ Decisions Made
Extract all decisions agreed upon during the meeting.

4. 📋 Action Items
List all tasks mentioned.
- Include responsible persons if names are mentioned.
- Format clearly as task → person (if available).

5. ⏱️ Important Moments
Highlight key turning points or important parts of the discussion.

6. ⚠️ Issues / Risks
Mention any problems, blockers, or concerns raised.

7. 💡 Final Insight
Give a short professional conclusion about the meeting outcome and progress.

---

Rules:
- Do NOT invent any information.
- If something is missing or unclear, write "Not specified".
- Be concise, structured, and professional.
- Use bullet points where appropriate.

---

Transcript:
{TRANSCRIPT}
"""


def _fallback_report() -> str:
    return """## 📌 Meeting Summary
Not specified (no usable transcript or AI provider configured).

## 🧠 Key Discussion Points
- Not specified

## ✅ Decisions Made
- Not specified

## 📋 Action Items
- Not specified

## ⏱️ Important Moments
- Not specified

## ⚠️ Issues / Risks
- Not specified

## 💡 Final Insight
Not specified
"""


@router.post("/text", response_model=SummarizeTextResponse)
def summarize_text(body: SummarizeTextRequest):
    transcript = body.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript is empty.")

    prompt = _PROMPT_TEMPLATE.replace("{TRANSCRIPT}", transcript)

    openai_key = os.getenv("OPENAI_API_KEY") or ""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY") or ""

    if openai_key:
        try:
            from openai import OpenAI

            model = os.getenv("OPENAI_MODEL") or "gpt-4o-mini"
            client = OpenAI(api_key=openai_key)
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "Return only the report content, in markdown."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            content = (resp.choices[0].message.content or "").strip()
            return SummarizeTextResponse(provider="openai", model=model, report=content or _fallback_report())
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"OpenAI summarization failed: {e}")

    if anthropic_key:
        try:
            from anthropic import Anthropic

            model = os.getenv("ANTHROPIC_MODEL") or "claude-3-5-sonnet-latest"
            client = Anthropic(api_key=anthropic_key)
            msg = client.messages.create(
                model=model,
                max_tokens=1200,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}],
            )
            # anthropic returns list of content blocks
            text = ""
            for block in getattr(msg, "content", []) or []:
                if getattr(block, "type", None) == "text":
                    text += getattr(block, "text", "")
            text = text.strip()
            return SummarizeTextResponse(provider="anthropic", model=model, report=text or _fallback_report())
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Anthropic summarization failed: {e}")

    return SummarizeTextResponse(provider="none", model=None, report=_fallback_report())
