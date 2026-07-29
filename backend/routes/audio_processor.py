import os
import tempfile
import json
import time
import requests
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
import google.generativeai as genai
from dotenv import load_dotenv
import logging

from services.chunking import split_transcript
from services.embedding_service import EmbeddingService
from services.vector_store import VectorStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

# ── RAG singletons ─────────────────────────────────────────────────────────────
embedder = EmbeddingService()
vector_store = VectorStore()

# ── AssemblyAI helpers ────────────────────────────────────────────────────────

ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2"

def assemblyai_upload(tmp_path: str, api_key: str) -> str:
    """رفع الملف الصوتي على AssemblyAI والحصول على رابط التحميل"""
    headers = {"authorization": api_key}
    with open(tmp_path, "rb") as f:
        response = requests.post(f"{ASSEMBLYAI_BASE}/upload", headers=headers, data=f)
    response.raise_for_status()
    return response.json()["upload_url"]

def assemblyai_transcribe(upload_url: str, api_key: str, language_code: str = None) -> dict:
    """إرسال طلب النسخ الصوتي مع تفعيل تحديد المتحدثين"""
    headers = {"authorization": api_key, "content-type": "application/json"}
    payload = {
        "audio_url": upload_url,
        "speaker_labels": True,          # تحديد المتحدثين
        "speakers_expected": 2,          # عدد المتحدثين المتوقع
        "punctuate": True,               # علامات الترقيم
        "format_text": True,             # تنسيق النص
    }
    if language_code:
        payload["language_code"] = language_code
        logger.info(f"AssemblyAI using forced language: {language_code}")
    else:
        payload["language_detection"] = True
        logger.info("AssemblyAI using automatic language detection")
        
    response = requests.post(f"{ASSEMBLYAI_BASE}/transcript", headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

def assemblyai_poll(transcript_id: str, api_key: str, timeout: int = 300) -> dict:
    """الانتظار حتى اكتمال النسخ الصوتي"""
    headers = {"authorization": api_key}
    url = f"{ASSEMBLYAI_BASE}/transcript/{transcript_id}"
    start = time.time()
    while True:
        if time.time() - start > timeout:
            raise TimeoutError("AssemblyAI transcription timed out")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        status = data.get("status")
        if status == "completed":
            return data
        elif status == "error":
            raise Exception(f"AssemblyAI error: {data.get('error')}")
        logger.info(f"Transcription status: {status} — waiting...")
        time.sleep(1)

def build_speaker_segments(utterances: list, participant_name: str = None) -> tuple[list, list, str]:
    """
    تحويل utterances من AssemblyAI إلى:
    - formatted_transcript: [{speaker, text}]
    - speakers: قائمة أسماء المتحدثين
    - full_text: النص الكامل
    المتحدث الأول (A) = صاحب الجهاز باسمه الحقيقي
    يدعم العربية والإنجليزية والمزيج
    """
    speaker_map = {}
    formatted = []
    full_lines = []

    for utt in (utterances or []):
        label = utt.get("speaker", "A")
        text  = utt.get("text", "").strip()
        if not text:
            continue
        if label not in speaker_map:
            n = len(speaker_map) + 1
            if n == 1 and participant_name:
                # المتحدث الأول = صاحب الجهاز باسمه الحقيقي
                speaker_map[label] = participant_name
            else:
                # Detect language of this utterance to choose label style
                arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
                if arabic_chars > len(text) * 0.3:
                    speaker_map[label] = f"متحدث {n}"
                else:
                    speaker_map[label] = f"Speaker {n}"
        name = speaker_map[label]
        formatted.append({
            "speaker": name,
            "text": text,
            "start": utt.get("start"),
            "end": utt.get("end")
        })
        full_lines.append(f"{name}: {text}")

    speakers = list(speaker_map.values())
    full_text = "\n".join(full_lines)
    return formatted, speakers, full_text

# ── Gemini helpers ────────────────────────────────────────────────────────────

def find_available_model(api_key: str) -> str:
    """اختيار أفضل موديل Gemini متاح"""
    try:
        genai.configure(api_key=api_key)
        available = [
            m.name for m in genai.list_models()
            if "generateContent" in m.supported_generation_methods
        ]
        priorities = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-pro",
            "models/gemini-pro",
        ]
        for p in priorities:
            if p in available:
                logger.info(f"Selected Gemini model: {p}")
                return p
        if available:
            return available[0]
    except Exception as e:
        logger.error(f"Model discovery failed: {e}")
    return "models/gemini-1.5-flash"

def gemini_generate(model, prompt: str, max_retries: int = 3) -> str:
    """توليد نص مع إعادة المحاولة عند تجاوز الحصة"""
    for attempt in range(max_retries):
        try:
            return model.generate_content(prompt).text
        except Exception as e:
            err = str(e)
            logger.warning(f"Gemini attempt {attempt+1} failed: {err}")
            if ("429" in err or "quota" in err.lower()) and attempt < max_retries - 1:
                time.sleep((attempt + 1) * 2)
                continue
            if attempt == max_retries - 1:
                raise
    raise Exception("Gemini failed after all retries")

def gemini_analyze(model, transcript_with_speakers: str) -> dict:
    """تحسين النص + تحليل محضر الاجتماع في خطوة واحدة بجودة عالية — يدعم العربية والإنجليزية والمزيج"""
    prompt = f"""You are a professional meeting analyst and expert text editor.
You can handle Arabic, English, or mixed-language meetings perfectly.

Meeting transcript:
===
{transcript_with_speakers}
===

STEP 1 — Improve the transcript:
- Fix spelling and grammar errors in both Arabic and English.
- Add appropriate punctuation.
- Keep speaker names exactly as they are (متحدث 1:, Speaker 1:, etc.)
- Do NOT delete or add any information.
- Preserve the original language(s) — if the speaker used Arabic, keep Arabic; if English, keep English; if mixed, keep mixed.
- In addition to the full corrected text in "refined_transcript", also return "refined_segments" which is an array of objects for each line/segment in the transcript. The number of objects in "refined_segments" MUST EXACTLY MATCH the number of speaker lines in the input transcript.

STEP 2 — Full analysis:
Detect the primary language of the meeting and write ALL analysis fields in that same language.
If the meeting is mixed Arabic/English, use Arabic for the analysis.

SUMMARY: Write 3-5 sentences summarizing the meeting goal, what was discussed, and the final outcome. Do not mention speaker names.

NOTES: Extract every important idea or piece of information — each point a complete clear sentence, no repetition.

KEY_DECISIONS: Only decisions that were actually agreed upon. Each starts with "It was agreed that..." / "تم الاتفاق على..." / "It was decided..." / "قُرر...". If none, write [].

TODO_LIST: Every task mentioned whether assigned or not. Use action verb format: "Review...", "مراجعة...", "Prepare...", "إعداد...".

ACTION_ITEMS: Only tasks assigned to a specific person. Extract them as a list of structured JSON objects. Each object must contain exactly: "task" (description of task), "owner" (assigned person name/label), "deadline" (date/time or "None"), "priority" ("High", "Medium", or "Low"), "status" ("Pending"), "follow_up" ("follow up details or 'None'"). If none, write [].

Return ONLY JSON with no extra text or markdown:
{{
  "refined_transcript": "Full improved transcript here with speaker names",
  "refined_segments": [
    {{
      "speaker": "Speaker Name/Label",
      "text": "Corrected text for this segment"
    }}
  ],
  "analysis": {{
    "summary": "Executive summary",
    "notes": ["point 1", "point 2", "point 3"],
    "key_decisions": ["decision 1", "decision 2"],
    "todo_list": ["task 1", "task 2"],
    "action_items": [
      {{
        "task": "Task description",
        "owner": "Person name/label",
        "deadline": "Deadline or None",
        "priority": "High/Medium/Low",
        "status": "Pending",
        "follow_up": "Follow-up details or None"
      }}
    ]
  }}
}}"""

    text = gemini_generate(model, prompt)
    # تنظيف الـ markdown blocks لو موجودة
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # محاولة استخراج الـ JSON من النص لو فيه نص زيادة
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise

def cleanup_temp_file(path):
    try:
        if path and os.path.exists(path):
            os.unlink(path)
    except Exception as e:
        logger.warning(f"Could not delete temp file: {e}")

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/chat-with-meeting")
async def chat_with_meeting(
    message: str = Body(..., embed=True),
    meeting_id: str = Body(..., embed=True),
    history: list = Body([], embed=True),
):
    """الدردشة مع محتوى الاجتماع باستخدام Gemini (RAG عبر ChromaDB)"""
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        # ── RAG retrieval: fetch relevant context chunks from ChromaDB ──────────
        try:
            question_embedding = embedder.embed_text(message)
            results = vector_store.search(
                meeting_id=meeting_id,
                embedding=question_embedding,
                k=5,
            )
            documents = results.get("documents", [[]])[0]
        except Exception as rag_err:
            logger.error(f"RAG retrieval failed for meeting {meeting_id}: {rag_err}")
            documents = []

        if not documents:
            logger.warning(f"No indexed transcript context found for meeting {meeting_id}")
            return {"reply": "لا يوجد محتوى مفهرس لهذا الاجتماع بعد، لذلك لا يمكنني الإجابة على سؤالك حالياً. من فضلك تأكد من اكتمال تحليل الاجتماع أولاً."}

        context = "\n\n".join(documents)

        genai.configure(api_key=api_key)
        
        # List available models
        available = []
        try:
            available = [
                m.name for m in genai.list_models()
                if "generateContent" in m.supported_generation_methods
            ]
        except Exception as e:
            logger.error(f"Model list failed: {e}")
            
        model_candidates = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-pro",
            "models/gemini-pro"
        ]
        # Add any other listed models not in our list
        for m in available:
            if m not in model_candidates:
                model_candidates.append(m)

        chat_context = f"""
You are Echo Meet AI.
Retrieved Meeting Context:
{context}
Instructions:
- Answer ONLY using the retrieved meeting context.
- If the answer is not contained in the context, clearly say you don't know.
- Never hallucinate.
- Answer in the user's language.
User Question:
{message}
"""

        reply = None
        last_err = None
        for model_name in model_candidates:
            if available and model_name not in available:
                continue
            try:
                logger.info(f"Attempting Chat with model: {model_name}")
                model = genai.GenerativeModel(model_name)
                reply = gemini_generate(model, chat_context)
                logger.info(f"Chat succeeded with model: {model_name}")
                break
            except Exception as e:
                last_err = e
                logger.warning(f"Chat model {model_name} failed: {e}")
                if "429" in str(e) or "quota" in str(e).lower():
                    logger.info(f"Model {model_name} quota exceeded, trying next candidate...")
                    continue
                else:
                    continue
                    
        if not reply:
            raise last_err

        return {"reply": reply}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-audio")
async def analyze_audio(
    file: UploadFile = File(...),
    meeting_id: str = Form(None),
    participant_name: str = Form(None),
    duration: float = Form(None),
    recording_started_at: str = Form(None)
):
    """تحليل الملف الصوتي — AssemblyAI للنسخ + Gemini للتحليل"""
    from datetime import datetime
    load_dotenv()
    assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY")
    gemini_key     = os.getenv("GEMINI_API_KEY")
    tmp_path = None
    meeting_duration = duration

    # Parse recording_started_at
    rec_started_at = None
    if recording_started_at:
        try:
            rec_started_at = int(float(recording_started_at))
        except Exception as e:
            logger.warning(f"Could not parse recording_started_at: {recording_started_at} | {e}")

    try:
        logger.info(f"analyze-audio called | meeting_id={meeting_id} | participant_name={participant_name} | duration={duration} | recording_started_at={recording_started_at}")
        # ── 1. حفظ الملف مؤقتاً ──────────────────────────────────────────
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file received")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # ── 2. النسخ الصوتي ───────────────────────────────────────────────
        speaker_label = participant_name or "متحدث 1"
        formatted_transcript = []
        speakers = [speaker_label]
        raw_transcript = ""
        transcript_with_speakers = ""

        # Read language preferences from settings database
        trans_lang_setting = None
        try:
            from database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = 'transcription_language'")
            row = cursor.fetchone()
            if row and row["value"]:
                trans_lang_setting = row["value"]
            conn.close()
        except Exception as db_err:
            logger.warning(f"Could not load language settings from database: {db_err}")

        transcription_lang = None
        if trans_lang_setting in ("ar", "en"):
            transcription_lang = trans_lang_setting
            logger.info(f"Using explicit transcription language setting: {transcription_lang}")
        else:
            logger.info("Transcription language setting is set to auto-detect (None)")

        if assemblyai_key:
            logger.info("Using AssemblyAI for transcription...")
            try:
                upload_url  = assemblyai_upload(tmp_path, assemblyai_key)
                job         = assemblyai_transcribe(upload_url, assemblyai_key, language_code=transcription_lang)
                result      = assemblyai_poll(job["id"], assemblyai_key)

                raw_transcript = result.get("text", "")
                utterances     = result.get("utterances", [])

                if not meeting_duration:
                    meeting_duration = result.get("audio_duration")

                if utterances:
                    formatted_transcript, speakers, transcript_with_speakers = build_speaker_segments(utterances, participant_name)
                    logger.info(f"Speaker diarization done: {len(speakers)} speakers")
                else:
                    # fallback: نص بدون تحديد متحدثين — استخدم اسم المتحدث الحقيقي
                    speaker_label = participant_name or "متحدث 1"
                    transcript_with_speakers = f"{speaker_label}: {raw_transcript}"
                    formatted_transcript = [{"speaker": speaker_label, "text": raw_transcript, "start": 0, "end": int((meeting_duration or 0) * 1000)}]
                    speakers = [speaker_label]

            except Exception as e:
                logger.warning(f"AssemblyAI failed, falling back to Whisper: {e}")
                assemblyai_key = None  # سيقع على الـ fallback

        if not assemblyai_key:
            # ── Fallback: Whisper small ───────────────────────────────────
            logger.info("Using Whisper (small) as fallback...")
            try:
                import whisper, torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
                wmodel = whisper.load_model("small", device=device)
                logger.info(f"Whisper using language: {transcription_lang or 'auto-detect'}")
                result = wmodel.transcribe(tmp_path, language=transcription_lang, fp16=False)
                raw_transcript = result["text"]
                detected_lang = result.get("language", "unknown")
                logger.info(f"Whisper detected language: {detected_lang}")
                speaker_label = participant_name or "متحدث 1"
                
                # Extract segments with start/end in milliseconds
                segments = result.get("segments", [])
                formatted_transcript = []
                full_lines = []
                for seg in segments:
                    text_seg = seg.get("text", "").strip()
                    if not text_seg:
                        continue
                    start_ms = int(seg.get("start", 0) * 1000)
                    end_ms = int(seg.get("end", 0) * 1000)
                    formatted_transcript.append({
                        "speaker": speaker_label,
                        "text": text_seg,
                        "start": start_ms,
                        "end": end_ms
                    })
                    full_lines.append(f"{speaker_label}: {text_seg}")
                
                if not meeting_duration and segments:
                    meeting_duration = segments[-1].get("end", 0)

                if not formatted_transcript:
                    formatted_transcript = [{"speaker": speaker_label, "text": raw_transcript, "start": 0, "end": 0}]
                    transcript_with_speakers = f"{speaker_label}: {raw_transcript}"
                else:
                    transcript_with_speakers = "\n".join(full_lines)
                
                speakers = [speaker_label]
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

        # Map segment offsets to absolute epoch milliseconds
        meeting_start_ms = None
        if meeting_id:
            try:
                from database import get_db_connection
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT started_at FROM meetings WHERE id = ?", (meeting_id,))
                row = cursor.fetchone()
                if row and row["started_at"]:
                    try:
                        iso_str = row["started_at"].replace('Z', '+00:00')
                        dt = datetime.fromisoformat(iso_str)
                        meeting_start_ms = int(dt.timestamp() * 1000)
                    except Exception as dt_err:
                        logger.warning(f"Failed to parse started_at ISO string: {row['started_at']} | {dt_err}")
                conn.close()
            except Exception as db_err:
                logger.warning(f"Failed to retrieve meeting started_at from DB: {db_err}")

        # Determine reference epoch start time
        ref_start_ms = rec_started_at or meeting_start_ms or int(time.time() * 1000)

        for seg in formatted_transcript:
            start_offset = seg.get("start", 0) or 0
            end_offset = seg.get("end", 0) or 0
            seg["absolute_start"] = ref_start_ms + start_offset
            seg["absolute_end"] = ref_start_ms + end_offset

        # Load existing analysis and segments from DB for merging
        existing_segments = []
        existing_analysis_data = {}
        if meeting_id:
            try:
                from database import get_db_connection, dict_from_row
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT analysis_json FROM meetings WHERE id = ?", (meeting_id,))
                row = cursor.fetchone()
                if row:
                    meeting_data = dict_from_row(row)
                    if meeting_data and meeting_data.get("analysis_json"):
                        existing_analysis_data = meeting_data["analysis_json"]
                        existing_segments = existing_analysis_data.get("speaker_segments", [])
                conn.close()
            except Exception as db_err:
                logger.warning(f"Failed to fetch existing analysis_json from database: {db_err}")

        # Merge and deduplicate segments
        all_segments = []
        seen_segments = set()
        
        def add_segment(seg):
            # Key for deduplication: (speaker, text, start_time)
            key = (seg.get("speaker", ""), seg.get("text", ""), seg.get("absolute_start", 0))
            if key not in seen_segments:
                seen_segments.add(key)
                all_segments.append(seg)
                
        for seg in existing_segments:
            add_segment(seg)
            
        for seg in formatted_transcript:
            add_segment(seg)
            
        # Sort chronologically by absolute start time
        all_segments.sort(key=lambda s: s.get("absolute_start", s.get("start", 0)))

        # Reconstruct transcript with speaker tags
        speakers = list(set([seg["speaker"] for seg in all_segments]))
        full_transcript_lines = []
        for seg in all_segments:
            full_transcript_lines.append(f"{seg['speaker']}: {seg['text']}")
        transcript_with_speakers = "\n".join(full_transcript_lines)

        # Re-calculate total duration
        total_duration = meeting_duration or 0
        if existing_analysis_data and existing_analysis_data.get("duration"):
            total_duration = max(total_duration, existing_analysis_data["duration"])
        if not total_duration and all_segments:
            first_start = all_segments[0].get("absolute_start", 0)
            last_end = all_segments[-1].get("absolute_end", 0)
            if last_end > first_start:
                total_duration = (last_end - first_start) / 1000.0

        # ── 3. تحسين النص + تحليل Gemini ──────────────────────────────────
        analysis = {
            "summary": "",
            "notes": [],
            "key_decisions": [],
            "todo_list": [],
            "action_items": [],
        }

        if gemini_key and transcript_with_speakers:
            try:
                genai.configure(api_key=gemini_key)
                
                # List available models
                available = []
                try:
                    available = [
                        m.name for m in genai.list_models()
                        if "generateContent" in m.supported_generation_methods
                    ]
                except Exception as e:
                    logger.error(f"Model list failed: {e}")
                    
                model_candidates = [
                    "models/gemini-2.5-flash",
                    "models/gemini-2.0-flash",
                    "models/gemini-1.5-flash",
                    "models/gemini-1.5-pro",
                    "models/gemini-pro"
                ]
                for m in available:
                    if m not in model_candidates:
                        model_candidates.append(m)
                
                full_data = None
                last_err = None
                
                for model_name in model_candidates:
                    if available and model_name not in available:
                        continue
                    try:
                        logger.info(f"Attempting Gemini analysis with model: {model_name}")
                        gmodel = genai.GenerativeModel(model_name)
                        full_data = gemini_analyze(gmodel, transcript_with_speakers)
                        logger.info(f"Gemini analysis succeeded with model: {model_name}")
                        break
                    except Exception as e:
                        last_err = e
                        logger.warning(f"Model {model_name} failed: {e}")
                        if "429" in str(e) or "quota" in str(e).lower():
                            logger.info(f"Model {model_name} quota exceeded, trying next candidate...")
                            continue
                        else:
                            continue
                
                if not full_data:
                    raise last_err
                
                analysis  = full_data.get("analysis", analysis)
                if full_data.get("refined_transcript"):
                    transcript_with_speakers = full_data["refined_transcript"]
                
                refined_segs = full_data.get("refined_segments", [])
                if refined_segs and len(refined_segs) == len(all_segments):
                    for i, seg in enumerate(all_segments):
                        seg["text"] = refined_segs[i].get("text", seg["text"])
                        seg["speaker"] = refined_segs[i].get("speaker", seg["speaker"])
                elif refined_segs:
                    for i, seg in enumerate(all_segments):
                        if i < len(refined_segs):
                            seg["text"] = refined_segs[i].get("text", seg["text"])
                            seg["speaker"] = refined_segs[i].get("speaker", seg["speaker"])

                logger.info("Gemini analysis and text corrections completed successfully")

            except Exception as e:
                logger.warning(f"Gemini analysis failed after trying all models: {e}")
                analysis["summary"] = transcript_with_speakers

        analysis_data = {
            "success": True,
            "meeting_id": meeting_id,
            "participant_name": participant_name or "متحدث 1",
            "raw_transcript": raw_transcript,
            "transcript": transcript_with_speakers,
            "speakers": speakers,
            "speaker_segments": all_segments,
            "analysis": analysis,
            "duration": total_duration,
        }

        # ── RAG indexing: store transcript chunks in ChromaDB ────────────────
        if meeting_id and transcript_with_speakers:
            try:
                vector_store.delete_meeting(meeting_id)
                chunks = split_transcript(transcript_with_speakers)
                for i, chunk in enumerate(chunks):
                    embedding = embedder.embed_text(chunk)
                    vector_store.add_chunk(
                        meeting_id=meeting_id,
                        chunk_id=f"{meeting_id}_{i}",
                        text=chunk,
                        embedding=embedding,
                    )
                logger.info(f"RAG indexing succeeded for meeting {meeting_id}: {len(chunks)} chunks stored")
            except Exception as rag_err:
                logger.error(f"RAG indexing failed for meeting {meeting_id}: {rag_err}")

        # Update database with complete analysis_json
        if meeting_id:
            try:
                from database import get_db_connection
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE meetings SET transcript = ?, summary = ?, action_items = ?, analysis_json = ? WHERE id = ?",
                    (
                        transcript_with_speakers,
                        analysis.get("summary", ""),
                        json.dumps(analysis.get("action_items", [])),
                        json.dumps(analysis_data),
                        meeting_id
                    )
                )
                conn.commit()
                conn.close()
                logger.info(f"Database updated successfully for meeting {meeting_id}")
            except Exception as db_err:
                logger.error(f"Failed to update database for meeting {meeting_id}: {db_err}")

        return analysis_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"analyze_audio error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_temp_file(tmp_path)