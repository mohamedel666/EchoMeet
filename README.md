# 🚀 Echo Meet

> 🏆 This repository is my official submission for the **Tips Hindawi Challenge (June–July 2026)**.

---

## 👤 Participant

| Field | Value |
|-------|-------|
| Full Name | Mohamed Farag |
| Project Name | Echo Meet |
| GitHub Username | mohamedel666 |
| Challenge Batch | June–July 2026 |
| Training Program | Large Language Models (LLMs) Program |
| Organization | Edrak for AI |

---

# 📖 Project Overview

Echo Meet is an AI-powered meeting assistant designed to transform online meetings into structured, searchable, and actionable information.

The platform automatically records meeting audio, transcribes conversations, identifies speakers, generates concise summaries, extracts action items and key decisions, and allows users to chat with their meetings using Retrieval-Augmented Generation (RAG).

By combining speech recognition, Large Language Models, and vector search, Echo Meet helps teams save time, improve productivity, and quickly retrieve important information from previous meetings.

---

# ✨ Features

- 🎙️ Automatic meeting transcription
- 👥 Speaker diarization
- 📝 AI-generated meeting summaries
- ✅ Action item extraction
- 💡 Key decision detection
- 💬 AI Chat with Meeting (RAG-powered)
- 🔍 Semantic search using ChromaDB
- 📄 Export reports (PDF, DOCX, TXT)
- 📊 Meeting analytics dashboard
- 🌐 Arabic & English language support

---

# 🛠️ Technologies Used

### Frontend

- React.js
- Vite
- Tailwind CSS

### Backend

- FastAPI
- Python

### AI & Machine Learning

- Google Gemini
- Ollama
- LangChain
- ChromaDB
- Sentence Transformers

### Speech Processing

- Whisper / AssemblyAI
- Speaker Diarization

### Database

- SQLite
- SQLAlchemy

### Other Tools

- Git & GitHub
- VS Code
- REST APIs

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/EchoMeet.git
cd EchoMeet
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it:

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload
```

Run the frontend:

```bash
npm install
npm run dev
```

---

# 🚀 Usage

1. Upload or record a meeting.
2. The system transcribes the audio.
3. AI generates:
   - Meeting Summary
   - Action Items
   - Key Decisions
   - Analytics
4. The transcript is indexed into ChromaDB.
5. Ask questions about the meeting using the AI Chat.
6. The assistant retrieves relevant transcript chunks and generates context-aware answers using RAG.

---

# 📸 Demo

Add:

- Application screenshots
- System architecture diagram
- Demo GIF
- Demo video link

Example:

```
docs/demo.png
```

---

# 📈 Results

- Accurate AI meeting transcription.
- Intelligent meeting summarization.
- Retrieval-Augmented Generation (RAG) for meeting conversations.
- Semantic search over meeting transcripts.
- Exportable reports for documentation.
- Improved accessibility and productivity for online meetings.

---

# 🔮 Future Improvements

- Real-time meeting assistant.
- Multi-meeting knowledge base.
- Calendar integration.
- Email follow-up generation.
- Team collaboration features.
- Cloud deployment.
- Mobile application.

---

# 📚 About the Challenge

This project was developed as part of the **Tips Hindawi Challenge (June–July 2026)** under the **Large Language Models (LLMs) Program** organized by **Edrak for AI**.

The challenge focuses on building real-world AI applications using modern LLM technologies, software engineering best practices, and production-ready architectures.

---

# 📄 License

This project is shared for educational and portfolio purposes.