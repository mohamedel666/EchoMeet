#!/usr/bin/env python3
"""
اختبار شامل للتحقق من جميع مكونات التطبيق
"""

import os
import sys
import json
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
if Path("backend/.env").exists():
    load_dotenv(dotenv_path="backend/.env")
else:
    load_dotenv()


def test_env_variables():
    """اختبر متغيرات البيئة"""
    print("\n" + "="*50)
    print("🔍 اختبار متغيرات البيئة")
    print("="*50)
    
    required_vars = {
        "GEMINI_API_KEY": "مفتاح Google Gemini API",
    }
    optional_vars = {
        "HUGGINGFACE_TOKEN": "توكن Hugging Face (اختياري)",
    }
    
    all_good = True
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:10] + "..." if len(value) > 10 else value
            print(f"✅ {var}: {masked}")
        else:
            print(f"❌ {var}: غير معيّن")
            all_good = False
            
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:10] + "..." if len(value) > 10 else value
            print(f"✅ {var} (اختياري): {masked}")
        else:
            print(f"⚠️  {var} (اختياري): غير معيّن")

    
    return all_good

def test_whisper():
    """اختبر Whisper"""
    print("\n" + "="*50)
    print("🎤 اختبار Whisper")
    print("="*50)
    
    try:
        import whisper
        print("✅ Whisper مثبت")
        
        print("⏳ تحميل نموذج Whisper (tiny)...")
        model = whisper.load_model("tiny", device="cpu")
        print("✅ نموذج Whisper محمّل بنجاح")
        
        return True
    except ImportError:
        print("❌ Whisper غير مثبت")
        print("   الحل: pip install openai-whisper")
        return False
    except Exception as e:
        print(f"❌ خطأ في Whisper: {e}")
        return False

def test_gemini():
    """اختبر Gemini API"""
    print("\n" + "="*50)
    print("🤖 اختبار Gemini API")
    print("="*50)
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ GEMINI_API_KEY غير معيّن")
        return False
    
    try:
        import google.generativeai as genai
        print("✅ مكتبة Gemini مثبتة")
        
        genai.configure(api_key=api_key)
        print("✅ تم تكوين Gemini API")
        
        # اختبر قائمة النماذج
        print("⏳ البحث عن النماذج المتاحة...")
        models = list(genai.list_models())
        available = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        print(f"✅ عدد النماذج المتاحة: {len(available)}")
        
        # اختبر نموذج
        if available:
            model_name = available[0]
            print(f"⏳ اختبار النموذج: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("مرحبا، هل تعمل؟")
            print(f"✅ استجابة النموذج: {response.text[:50]}...")
            return True
        else:
            print("❌ لا توجد نماذج متاحة")
            return False
            
    except ImportError:
        print("❌ مكتبة Gemini غير مثبتة")
        print("   الحل: pip install google-generativeai")
        return False
    except Exception as e:
        print(f"❌ خطأ في Gemini: {e}")
        return False

def test_pyannote():
    """اختبر Pyannote (اختياري)"""
    print("\n" + "="*50)
    print("🎯 اختبار Pyannote (اختياري)")
    print("="*50)
    
    try:
        from pyannote.audio import Pipeline
        print("✅ Pyannote مثبت")
        
        token = os.getenv("HUGGINGFACE_TOKEN")
        if not token:
            print("⚠️  HUGGINGFACE_TOKEN غير معيّن (اختياري)")
            return True
        
        print("⏳ تحميل نموذج Pyannote...")
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.0",
            use_auth_token=token
        )
        print("✅ نموذج Pyannote محمّل بنجاح")
        return True
        
    except ImportError:
        print("⚠️  Pyannote غير مثبت (اختياري)")
        print("   الحل: pip install pyannote.audio")
        return True
    except Exception as e:
        print(f"⚠️  تحذير في Pyannote: {e}")
        return True

def test_fastapi():
    """اختبر FastAPI"""
    print("\n" + "="*50)
    print("🚀 اختبار FastAPI")
    print("="*50)
    
    try:
        import fastapi
        print("✅ FastAPI مثبت")
        
        import uvicorn
        print("✅ Uvicorn مثبت")
        
        return True
    except ImportError as e:
        print(f"❌ خطأ: {e}")
        print("   الحل: pip install fastapi uvicorn")
        return False

def test_react_dependencies():
    """اختبر تبعيات React"""
    print("\n" + "="*50)
    print("⚛️  اختبار تبعيات React")
    print("="*50)
    
    frontend_dir = Path("frontend")
    
    if not frontend_dir.exists():
        print("❌ مجلد frontend غير موجود")
        return False
    
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        print("❌ package.json غير موجود")
        return False
    
    print("✅ مجلد frontend موجود")
    print("✅ package.json موجود")
    
    node_modules = frontend_dir / "node_modules"
    if node_modules.exists():
        print("✅ node_modules موجود")
        return True
    else:
        print("⚠️  node_modules غير موجود")
        print("   الحل: cd frontend && npm install")
        return False

def run_all_tests():
    """تشغيل جميع الاختبارات"""
    print("\n" + "🔧 "*25)
    print("اختبار شامل لـ Echo Meet Application")
    print("🔧 "*25)
    
    results = {
        "متغيرات البيئة": test_env_variables(),
        "Whisper": test_whisper(),
        "Gemini API": test_gemini(),
        "Pyannote": test_pyannote(),
        "FastAPI": test_fastapi(),
        "React Dependencies": test_react_dependencies(),
    }
    
    print("\n" + "="*50)
    print("📊 ملخص النتائج")
    print("="*50)
    
    for test_name, passed in results.items():
        status = "✅" if passed else "❌"
        print(f"{status} {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*50)
    if all_passed:
        print("✅ جميع الاختبارات نجحت!")
        print("التطبيق جاهز للاستخدام")
    else:
        print("⚠️  بعض الاختبارات فشلت")
        print("يرجى حل المشاكل أعلاه قبل تشغيل التطبيق")
    print("="*50 + "\n")
    
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
