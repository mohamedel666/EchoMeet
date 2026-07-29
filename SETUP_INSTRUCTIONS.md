# تعليمات الإعداد الكاملة لـ Echo Meet

## 📋 المتطلبات

- Python 3.8+
- Node.js 14+
- npm أو yarn
- ميكروفون يعمل
- اتصال إنترنت

## 🔑 الخطوة 1: الحصول على المفاتيح والتوكنات

### 1.1 Google Gemini API Key
1. اذهب إلى [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. انقر على "Create API Key"
3. انسخ المفتاح

### 1.2 Hugging Face Token (اختياري، لـ Speaker Diarization)
1. اذهب إلى [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. انقر على "New token"
3. انسخ التوكن

## 🚀 الخطوة 2: إعداد Backend

```bash
# انتقل إلى مجلد Backend
cd backend

# أنشئ بيئة افتراضية
python -m venv venv

# فعّل البيئة الافتراضية
# على Windows:
venv\Scripts\activate
# على macOS/Linux:
source venv/bin/activate

# ثبّت التبعيات
pip install -r requirements.txt

# أنشئ ملف .env
cat > .env << EOF
GEMINI_API_KEY=your_gemini_key_here
HUGGINGFACE_TOKEN=your_huggingface_token_here
EOF

# استبدل القيم بالمفاتيح الفعلية
```

## 🎨 الخطوة 3: إعداد Frontend

```bash
# انتقل إلى مجلد Frontend
cd frontend

# ثبّت التبعيات
npm install
# أو
yarn install

# أنشئ ملف .env
cat > .env << EOF
VITE_API_URL=http://localhost:5000
EOF
```

## ✅ الخطوة 4: التحقق من الإعداد

```bash
# من مجلد المشروع الرئيسي
python test_integration.py
```

سيقوم هذا بفحص:
- ✅ متغيرات البيئة
- ✅ Whisper
- ✅ Gemini API
- ✅ Pyannote (اختياري)
- ✅ FastAPI
- ✅ React Dependencies

## 🎬 الخطوة 5: تشغيل التطبيق

### تشغيل Backend:
```bash
cd backend
source venv/bin/activate  # على Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

### تشغيل Frontend (في نافذة منفصلة):
```bash
cd frontend
npm run dev
# أو
yarn dev
```

سيفتح التطبيق على: http://localhost:5173

## 🧪 الخطوة 6: الاختبار

1. **افتح التطبيق** في المتصفح
2. **انقر على "Start Meeting"**
3. **تحدث لعدة ثوان** (تأكد من السماح بالوصول للميكروفون)
4. **انقر على "Leave Meeting"**
5. **انتظر معالجة الصوت**
6. **شاهد النتائج** (الملخص، المهام، الملاحظات)

## 🔍 استكشاف الأخطاء

### المشكلة: "No microphone access"
**الحل**:
- تأكد من السماح بالوصول للميكروفون في إعدادات المتصفح
- جرب متصفح مختلف
- تحقق من أن الميكروفون يعمل

### المشكلة: "Empty audio file"
**الحل**:
- تحدث بصوت عالي أثناء التسجيل
- تأكد من أن الميكروفون مفعّل
- جرب ملف صوت مختلف

### المشكلة: "Quota exceeded"
**الحل**:
- انتظر قليلاً قبل المحاولة مرة أخرى
- تحقق من حد الاستخدام في Google Cloud Console
- استخدم API key جديد

### المشكلة: "Model not found"
**الحل**:
- تحقق من أن API key صحيح
- تأكد من أن النموذج متاح في منطقتك
- جرب نموذج مختلف

## 📚 ملفات مهمة

| الملف | الوصف |
|------|--------|
| `backend/routes/audio_processor.py` | معالجة الصوت والتحليل |
| `frontend/src/hooks/useAudioRecorder.js` | تسجيل الصوت |
| `frontend/src/hooks/useAudioUpload.js` | إرسال الصوت للـ Backend |
| `DEBUGGING_GUIDE.md` | دليل تشخيص المشاكل |
| `test_integration.py` | اختبار جميع المكونات |

## 📖 الميزات

- ✅ تسجيل صوتي تلقائي أثناء الاجتماع
- ✅ تحويل الصوت إلى نص باستخدام Whisper
- ✅ تحديد المتحدثين (Speaker Diarization)
- ✅ تحليل ذكي باستخدام Gemini
- ✅ إنشاء ملخص تنفيذي
- ✅ استخراج المهام والقرارات
- ✅ واجهة مستخدم سهلة الاستخدام

## 🛠️ المتطلبات التقنية

### Backend:
- FastAPI
- Uvicorn
- OpenAI Whisper
- Google Generative AI
- Pyannote (اختياري)

### Frontend:
- React 18+
- Tailwind CSS
- Vite
- Axios

## 📝 ملاحظات

- تأكد من أن جميع المفاتيح والتوكنات صحيحة
- استخدم HTTPS في الإنتاج
- احفظ المفاتيح في متغيرات البيئة فقط
- لا تشارك المفاتيح مع أحد

## 🤝 الدعم

إذا واجهت مشاكل:
1. اقرأ `DEBUGGING_GUIDE.md`
2. شغّل `test_integration.py`
3. تحقق من Console logs في المتصفح
4. تحقق من Network tab في Developer Tools

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License

---

**آخر تحديث**: 2024
**الإصدار**: 1.0.0
