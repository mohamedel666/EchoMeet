# دليل تشخيص مشاكل التطبيق

## المشكلة: النص يختفي أو لا يتم تحليله

### الخطوة 1: تحقق من Console Logs
افتح Developer Tools (F12) وانظر إلى Console tab:

```
✅ يجب أن ترى:
- "Starting audio recording..."
- "Audio stream obtained: MediaStream"
- "MediaRecorder started successfully"
- "Data available: XXX bytes" (عدة مرات أثناء التسجيل)
- "Stopping recording..."
- "Total chunks collected: N"
- "Final blob size: XXX bytes"

❌ إذا رأيت:
- "No recording in progress" → لم يبدأ التسجيل
- "Final blob size: 0" → الصوت لم يُسجَّل
- أخطاء في الأذونات → السماح بالوصول للميكروفون
```

### الخطوة 2: تحقق من Network Tab
في Developer Tools، انظر إلى Network tab عند الضغط على "Leave":

```
✅ يجب أن ترى:
- POST request إلى /analyze-audio
- Status: 200
- Response يحتوي على JSON مع "success": true

❌ إذا رأيت:
- Status: 400 → الملف فارغ أو غير صحيح
- Status: 500 → خطأ في الـ Backend
- No request → لم يتم إرسال الملف
```

### الخطوة 3: تحقق من متغيرات البيئة

#### في Backend:
```bash
# تحقق من .env في المجلد الرئيسي
cat .env

# يجب أن يحتوي على:
GEMINI_API_KEY=sk-...
HUGGINGFACE_TOKEN=hf_...
```

#### في Frontend:
```bash
# تحقق من .env في frontend/
cat frontend/.env

# يجب أن يحتوي على:
VITE_API_URL=http://127.0.0.1:8002
```

### الخطوة 4: اختبر الميكروفون

في Console، اكتب:
```javascript
// اختبر الوصول للميكروفون
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log("✅ Microphone access granted");
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error("❌ Microphone error:", err));
```

### الخطوة 5: اختبر الـ Backend مباشرة

```bash
# إنشاء ملف صوت اختبار
# أو استخدم ملف صوت موجود

# اختبر الـ API
curl -X POST http://127.0.0.1:8002/analyze-audio \
  -F "file=@test_audio.webm"

# يجب أن تحصل على JSON response
```

## الأخطاء الشائعة وحلولها

### 1. "Empty audio file received"
**السبب**: لم يتم تسجيل أي صوت
**الحل**:
- تأكد من السماح بالوصول للميكروفون
- تحدث بصوت عالي أثناء التسجيل
- تحقق من أن الميكروفون يعمل

### 2. "No speech detected in audio"
**السبب**: الصوت مسجل لكن Whisper لم يتمكن من التعرف عليه
**الحل**:
- تحقق من جودة الصوت
- تأكد من أن اللغة عربية
- جرب مع صوت أعلى

### 3. "Quota exceeded"
**السبب**: تم تجاوز حد استخدام Gemini API
**الحل**:
- انتظر قليلاً قبل المحاولة مرة أخرى
- تحقق من حد الاستخدام في Google Cloud Console
- استخدم API key جديد إذا لزم الأمر

### 4. "Model not found"
**السبب**: نموذج Gemini المحدد غير متاح
**الحل**:
- التطبيق يكتشف النموذج تلقائياً
- تحقق من أن API key صحيح
- جرب نموذج مختلف في الكود

## خطوات التشخيص المتقدمة

### تفعيل Verbose Logging

في `useAudioRecorder.js`، أضف في `startRecording`:
```javascript
// بعد mediaRecorder.start()
setInterval(() => {
  console.log("Recording state:", mediaRecorder.state);
  console.log("Chunks so far:", chunksRef.current.length);
}, 1000);
```

### اختبر الـ Transcription منفصلة

في `audio_processor.py`:
```python
# اختبر Whisper بدون Gemini
result = whisper_model.transcribe("test_audio.webm", language="ar")
print("Transcript:", result["text"])
```

### اختبر Gemini منفصلة

```python
import google.generativeai as genai
genai.configure(api_key="YOUR_KEY")
model = genai.GenerativeModel("models/gemini-2.5-flash")
response = model.generate_content("مرحبا")
print(response.text)
```

## قائمة التحقق النهائية

- [ ] الميكروفون يعمل ومسموح به
- [ ] GEMINI_API_KEY معيّن بشكل صحيح
- [ ] HUGGINGFACE_TOKEN معيّن (إذا استخدمت Pyannote)
- [ ] الـ Backend يعمل على المنفذ الصحيح
- [ ] الـ Frontend يتصل بـ Backend الصحيح
- [ ] تم تسجيل صوت فعلي (> 0 bytes)
- [ ] لا توجد أخطاء في Console
- [ ] الـ Response يحتوي على JSON صحيح

## الدعم

إذا استمرت المشكلة:
1. اجمع logs من Console و Network tab
2. اختبر كل مكون منفصل
3. تحقق من جميع متغيرات البيئة
4. جرب مع ملف صوت مختلف
