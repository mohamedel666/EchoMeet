import os
import tempfile
import json
import time
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
import whisper
import google.generativeai as genai
import torch
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Force load .env
load_dotenv()

router = APIRouter()

# Global variables for model management
whisper_model = None
model_load_attempted = False

def load_whisper_model():
    """Load Whisper model lazily on first use"""
    global whisper_model, model_load_attempted
    
    if model_load_attempted:
        return whisper_model
    
    model_load_attempted = True
    
    try:
        logger.info("Loading Whisper model (tiny) for high speed...")
        # Try to use GPU if available, fallback to CPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        whisper_model = whisper.load_model("tiny", device=device)
        logger.info("Whisper model loaded successfully!")
        return whisper_model
    except Exception as e:
        logger.error(f"Error loading Whisper: {e}")
        return None

def find_available_model(api_key):
    """Dynamically find an available Gemini model to avoid 404 errors"""
    try:
        genai.configure(api_key=api_key)
        # List available models
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        logger.info(f"Available models: {available_models}")
        
        # Priority list
        priorities = [
            'models/gemini-2.5-flash',
            'models/gemini-2.0-flash',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-pro',
            'models/gemini-pro'
        ]
        for p in priorities:
            if p in available_models:
                logger.info(f"Selected model: {p}")
                return p
        
        # Fallback to first available
        if available_models:
            logger.info(f"Selected fallback model: {available_models[0]}")
            return available_models[0]
    except Exception as e:
        logger.error(f"Error discovering models: {e}")
    return "models/gemini-2.5-flash"

def analyze_with_gemini_with_retry(model, prompt, max_retries=3):
    """محاولة التحليل مع إعادة المحاولة عند الفشل"""
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_str = str(e)
            logger.warning(f"Attempt {attempt + 1} failed: {error_str}")
            
            # إذا كان الخطأ quota، انتظر قليلاً وحاول مرة أخرى
            if "429" in error_str or "quota" in error_str.lower():
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    logger.info(f"Quota exceeded, waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                    continue
            
            # إذا كان آخر محاولة، أعد رسالة خطأ
            if attempt == max_retries - 1:
                raise e
    
    raise Exception("Failed to analyze after all retries")

def cleanup_temp_file(tmp_path):
    """تنظيف الملف المؤقت بشكل آمن"""
    try:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            logger.info(f"Deleted temp file: {tmp_path}")
    except Exception as e:
        logger.warning(f"Warning: Could not delete temp file: {e}")

@router.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...), meeting_id: str = None):
    """
    تحليل الملف الصوتي واستخراج النسخ الصوتية والتحليلات
    
    المعاملات:
    - file: الملف الصوتي المراد تحليله
    - meeting_id: معرف الاجتماع (اختياري) لربط التحليل بالاجتماع
    """
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    tmp_path = None
    
    try:
        # تحقق من حجم الملف
        content = await file.read()
        logger.info(f"Received file: {file.filename}, size: {len(content)} bytes, meeting_id: {meeting_id}")
        
        if len(content) == 0:
            logger.error("Error: Empty file received")
            raise HTTPException(status_code=400, detail="Empty audio file received")
        
        # إنشاء ملف مؤقت
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
            logger.info(f"Saved to temp file: {tmp_path}")

        # تحميل نموذج Whisper بشكل كسول
        whisper_model = load_whisper_model()
        if not whisper_model:
            raise HTTPException(status_code=500, detail="Whisper model not loaded")
        
        # النسخ الصوتي
        logger.info("Transcribing audio...")
        try:
            # اسمح بتحديد اللغة من المعامل، وإلا استخدم العربية كافتراضي
            language = "ar"  # يمكن تعديل هذا لاحقاً لدعم لغات متعددة
            result = whisper_model.transcribe(tmp_path, language=language, fp16=False)
            transcript = result["text"]
            logger.info(f"Transcription complete: {transcript[:100]}...")
            
            if not transcript or len(transcript.strip()) == 0:
                logger.error("Error: Empty transcript")
                raise HTTPException(status_code=400, detail="No speech detected in audio")
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

        # التحليل باستخدام Gemini
        logger.info("Analyzing with Gemini (Auto-Discovery Mode)...")
        analysis = {}
        formatted_transcript = []
        speakers = ["متحدث 1"]
        
        if api_key:
            try:
                # اكتشاف اسم النموذج الصحيح
                model_name = find_available_model(api_key)
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name)

                prompt = f"""
أنت خبير في تحليل محاضر الاجتماعات. لديك النص التالي المستخرج من تسجيل صوتي لاجتماع باللغة العربية:

"{transcript}"

المطلوب منك (بشكل سريع ومختصر):
1. تقسيم النص إلى حوار بين متحدثين (متحدث 1، متحدث 2، إلخ).
2. تقديم تحليل شامل للاجتماع بصيغة JSON.

يجب أن يكون الرد بصيغة JSON فقط كالتالي:
{{
  "formatted_transcript": [
    {{"speaker": "متحدث 1", "text": "نص الكلام هنا"}},
    {{"speaker": "متحدث 2", "text": "نص الكلام هنا"}}
  ],
  "analysis": {{
    "summary": "ملخص تنفيذي شامل",
    "notes": ["نقطة هامة 1"],
    "todo_list": ["مهمة مطلوبة 1"],
    "key_decisions": ["قرار تم اتخاذه 1"],
    "action_items": ["إجراء تنفيذي 1"]
  }},
  "speakers": ["متحدث 1", "متحدث 2"]
}}
Only return the JSON. No extra text.
                """
                
                # محاولة التحليل مع إعادة المحاولة
                text_content = analyze_with_gemini_with_retry(model, prompt)
                logger.info(f"Gemini response received: {text_content[:100]}...")
                
                # تنظيف استجابة JSON
                if "```json" in text_content:
                    text_content = text_content.split("```json")[1].split("```")[0].strip()
                elif "```" in text_content:
                    text_content = text_content.split("```")[1].split("```")[0].strip()
                
                try:
                    full_data = json.loads(text_content)
                    analysis = full_data.get("analysis", {})
                    formatted_transcript = full_data.get("formatted_transcript", [])
                    speakers = full_data.get("speakers", ["متحدث 1"])
                    logger.info("Successfully parsed Gemini response")
                except json.JSONDecodeError as je:
                    logger.error(f"JSON parsing error: {je}")
                    logger.error(f"Raw response: {text_content[:200]}")
                    # استخدم قيم افتراضية في حالة الفشل
                    analysis = {
                        "summary": transcript[:500] if len(transcript) > 500 else transcript,
                        "notes": [],
                        "todo_list": [],
                        "key_decisions": [],
                        "action_items": []
                    }
                    formatted_transcript = [{"speaker": "متحدث 1", "text": transcript}]
                    speakers = ["متحدث 1"]
                    
            except Exception as e:
                logger.warning(f"Warning: Gemini analysis failed: {e}")
                # إذا فشل التحليل، استخدم النص الخام كبديل
                analysis = {
                    "summary": transcript[:500] if len(transcript) > 500 else transcript,
                    "notes": ["تم استخراج النص من الصوت بنجاح"],
                    "todo_list": [],
                    "key_decisions": [],
                    "action_items": []
                }
                formatted_transcript = [{"speaker": "متحدث 1", "text": transcript}]
                speakers = ["متحدث 1"]
        else:
            logger.warning("Warning: GEMINI_API_KEY not set")
            analysis = {
                "summary": "مفتاح API مفقود - تم استخراج النص من الصوت فقط",
                "notes": [],
                "todo_list": [],
                "key_decisions": [],
                "action_items": []
            }
            formatted_transcript = [{"speaker": "متحدث 1", "text": transcript}]
            speakers = ["متحدث 1"]

        # بناء الاستجابة
        result = {
            "success": True,
            "meeting_id": meeting_id,
            "transcript": transcript,
            "speakers": speakers,
            "speaker_segments": formatted_transcript,
            "analysis": analysis
        }
        
        logger.info(f"Returning result: {json.dumps(result, ensure_ascii=False)[:200]}...")
        return result

    except HTTPException as he:
        logger.error(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # تنظيف الملف المؤقت في جميع الحالات
        cleanup_temp_file(tmp_path)
