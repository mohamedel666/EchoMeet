import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const API = import.meta.env.VITE_API_URL || '/api'

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, className = '', stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  transcript: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  summary: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  tasks: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  analytics: "M18 20V10 M12 20V4 M6 20v-6",
  insights: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 16v-4 M12 8h.01",
  timeline: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  keywords: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A2 2 0 0 1 3 12V7a4 4 0 0 1 4-4z",
  sentiment: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  send: "M22 2L11 13 M22 2L15 22 8 13 2 9z",
  copy: "M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  print: "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  newmeet: "M12 5v14 M5 12h14",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  help: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01",
  check: "M20 6L9 17l-5-5",
  spark: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  dots: "M12 5h.01 M12 12h.01 M12 19h.01",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  collapse: "M11 19l-7-7 7-7 M18 19l-7-7 7-7",
}

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'chat', label: 'AI Chats', icon: 'chat', badge: null },
  { id: 'transcript', label: 'Transcript', icon: 'transcript', badge: null },
  { id: 'summary', label: 'Summary', icon: 'summary', badge: null },
  { id: 'tasks', label: 'Action Items', icon: 'tasks', badge: 'count' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', badge: null },
]

const SUGGESTED = [
  { icon: 'tasks', text: 'ما أهم القرارات؟' },
  { icon: 'user', text: 'من المسؤول عن كل مهمة؟' },
  { icon: 'summary', text: 'لخص الاجتماع في 5 نقاط' },
  { icon: 'help', text: 'ما المشاكل التي تمت مناقشتها؟' },
  { icon: 'timeline', text: 'هل تم تحديد موعد للتسليم؟' },
  { icon: 'tasks', text: 'استخراج المهام فقط' },
]

const SMART_PROMPTS = [
  { label: 'Summarize meeting', icon: 'summary', color: '#6366f1' },
  { label: 'Extract action items', icon: 'tasks', color: '#10b981' },
  { label: 'Detect risks', icon: 'help', color: '#f59e0b' },
  { label: 'Generate follow-up email', icon: 'send', color: '#3b82f6' },
  { label: 'Create project timeline', icon: 'timeline', color: '#8b5cf6' },
]

// ── Donut chart (pure SVG) ────────────────────────────────────────────────────
function Donut({ segments, size = 80, stroke = 14 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const len = (seg.pct / 100) * circ
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset} />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

export default function SummaryResults() {
  const { roomName } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get('meetingId') || searchParams.get('mid')

  const [activeTab, setActiveTab] = useState('chat')
  const [collapsed, setCollapsed] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [messages, setMessages] = useState(() => {
    const isAr = localStorage.getItem('language') === 'ar';
    return [
      {
        role: 'bot', content: isAr
          ? `أهلاً بك! أنا مساعد Echo Meet الذكي 👋\nاسألني عن أي شيء يتعلق بهذا الاجتماع وسأساعدك.`
          : `Welcome! I am the Echo Meet Smart Assistant 👋\nAsk me anything about this meeting and I'll help you.`
      }
    ];
  })
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const chatEndRef = useRef(null)
  const [refreshing, setRefreshing] = useState(false)

  // Settings states
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState(() => localStorage.getItem('transcription_language') || 'auto');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') === 'true');
  const [profileName, setProfileName] = useState(() => localStorage.getItem('pname') || 'User');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('pemail') || 'user@email.com');
  const [settingsStatus, setSettingsStatus] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Share states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  const handleRefresh = async () => {
    if (!meetingId) return;
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/meetings/${meetingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.analysis_json) {
          setAnalysis(data.analysis_json);
          sessionStorage.setItem('meetingAnalysis', JSON.stringify(data.analysis_json));
        }
      }
    } catch (err) {
      console.error("Failed to refresh analysis:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let pollInterval = null;

    async function loadAnalysis() {
      if (meetingId) {
        try {
          const res = await fetch(`${API}/meetings/${meetingId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.analysis_json) {
              setAnalysis(data.analysis_json);
              sessionStorage.setItem('meetingAnalysis', JSON.stringify(data.analysis_json));
              return true; // Analysis is ready
            }
          }
        } catch (err) {
          console.error("Failed to fetch analysis from backend:", err);
        }
      }

      // Fallback: sessionStorage (only if meeting_id matches current meeting)
      const stored = sessionStorage.getItem('meetingAnalysis')
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (!meetingId || !parsed.meeting_id || parsed.meeting_id === meetingId)) {
            setAnalysis(parsed);
            return true;
          }
        } catch { }
      }

      return false; // Not ready yet
    }

    async function init() {
      const ready = await loadAnalysis();
      if (!ready && meetingId) {
        // Poll every 5 seconds until analysis is available
        pollInterval = setInterval(async () => {
          const done = await loadAnalysis();
          if (done && pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }, 5000);
      }
    }

    init();

    // Load settings from backend database
    async function loadDbSettings() {
      try {
        const res = await fetch(`${API}/meetings/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.language) {
            setLanguage(data.language);
            localStorage.setItem('language', data.language);
            // Dynamic welcome message update
            setMessages([
              {
                role: 'bot', content: data.language === 'ar'
                  ? `أهلاً بك! أنا مساعد Echo Meet الذكي 👋\nاسألني عن أي شيء يتعلق بهذا الاجتماع وسأساعدك.`
                  : `Welcome! I am the Echo Meet Smart Assistant 👋\nAsk me anything about this meeting and I'll help you.`
              }
            ]);
          }
          if (data.transcription_language) {
            setTranscriptionLanguage(data.transcription_language);
            localStorage.setItem('transcription_language', data.transcription_language);
          }
          if (data.theme) {
            setTheme(data.theme);
            localStorage.setItem('theme', data.theme);
            if (data.theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          if (data.notifications) {
            setNotifications(data.notifications === 'true');
            localStorage.setItem('notifications', data.notifications);
          }
          if (data.profileName) {
            setProfileName(data.profileName);
            localStorage.setItem('pname', data.profileName);
          }
          if (data.profileEmail) {
            setProfileEmail(data.profileEmail);
            localStorage.setItem('pemail', data.profileEmail);
          }
        }
      } catch (err) {
        console.warn('Failed to load settings from DB, using localStorage', err);
      }
    }
    loadDbSettings();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  async function saveSetting(key, val) {
    localStorage.setItem(key, val);
    try {
      await fetch(`${API}/meetings/settings/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: String(val) }),
      });
    } catch (err) {
      console.warn(`Failed to sync setting ${key} to DB`, err);
    }
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    saveSetting('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function handleLanguageChange(newLang) {
    setLanguage(newLang);
    saveSetting('language', newLang);
    setMessages([
      {
        role: 'bot', content: newLang === 'ar'
          ? `أهلاً بك! أنا مساعد Echo Meet الذكي 👋\nاسألني عن أي شيء يتعلق بهذا الاجتماع وسأساعدك.`
          : `Welcome! I am the Echo Meet Smart Assistant 👋\nAsk me anything about this meeting and I'll help you.`
      }
    ]);
  }

  function formatTimestamp(ms) {
    if (ms === undefined || ms === null) return '';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function highlightText(text, query) {
    if (!text) return '';
    if (!query || !query.trim()) return text;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-black dark:text-white rounded px-0.5 font-semibold">{part}</mark>
        : part
    );
  }

  // --- Export Utilities ---
  function exportTranscriptTXT() {
    const segments = analysis?.speaker_segments || [];
    let text = `Meeting Transcript - ${roomName}\n\n`;
    if (segments.length > 0) {
      segments.forEach(seg => {
        const timeStr = seg.start !== undefined ? ` [${formatTimestamp(seg.start)}]` : '';
        text += `${seg.speaker}${timeStr}: ${seg.text}\n\n`;
      });
    } else {
      text += analysis?.transcript || analysis?.raw_transcript || 'No transcript available.';
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomName}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hasArabic(text) {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  }

  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  async function exportTranscriptPDF() {
    const segments = analysis?.speaker_segments || [];
    const mainTranscript = analysis?.transcript || analysis?.raw_transcript || 'No transcript available.';
    const isArabic = language === 'ar' || hasArabic(mainTranscript);

    let transcriptHtml = '';
    if (segments.length > 0) {
      segments.forEach(seg => {
        const timeStr = seg.start !== undefined ? ` [${formatTimestamp(seg.start)}]` : '';
        const header = `${seg.speaker}${timeStr}`;
        const text = seg.text;

        transcriptHtml += `
          <div class="segment" style="margin-bottom: 15px;">
            <div class="segment-header" style="font-size: 12.5px; font-weight: 700; color: #2563EB; margin-bottom: 3px;">${escapeHtml(header)}</div>
            <div class="segment-text" style="font-size: 13.5px; line-height: 1.6; color: #334155;">${escapeHtml(text)}</div>
          </div>
        `;
      });
    } else {
      transcriptHtml = `<p class="main-text" style="font-size: 13.5px; line-height: 1.6; color: #334155; text-align: justify;">${escapeHtml(mainTranscript).replace(/\n/g, '<br/>')}</p>`;
    }

    const titleText = language === 'ar' ? `نص الاجتماع: ${roomName}` : `Meeting Transcript: ${roomName}`;
    const dateLabel = language === 'ar' ? `التاريخ: ${new Date().toLocaleDateString('ar-EG')}` : `Date: ${new Date().toLocaleDateString()}`;

    const htmlContent = `
      <div style="font-family: ${isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif"}; padding: 25px; direction: ${isArabic ? 'rtl' : 'ltr'}; color: #1e293b; background: #fff;">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
        </style>
        <div class="header" style="border-bottom: 2px solid #2563EB; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 style="font-size: 22px; margin: 0 0 6px 0; color: #0f172a;">${titleText}</h1>
          <div class="date" style="font-size: 12px; color: #64748b;">${dateLabel}</div>
        </div>
        <div class="transcript-content">
          ${transcriptHtml}
        </div>
      </div>
    `;

    try {
      const html2pdf = await loadHtml2Pdf();

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '790px'; // standard A4 width
      container.style.zIndex = '-9999';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const opt = {
        margin: 15,
        filename: `${roomName}_transcript.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: false,
          useCORS: true,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await new Promise(r => setTimeout(r, 300));
      if (document.fonts) {
        await document.fonts.ready;
      }

      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
    } catch (err) {
      console.warn('Failed to load html2pdf, falling back to browser print...', err);
      // Fallback: print via iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const printHtml = `
        <html>
          <head>
            <title>${titleText}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
              body {
                font-family: ${isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
                padding: 40px;
                color: #1e293b;
                direction: ${isArabic ? 'rtl' : 'ltr'};
                background: #fff;
                margin: 0;
              }
              .header {
                border-bottom: 2px solid #2563EB;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              h1 {
                font-size: 24px;
                margin: 0 0 8px 0;
                color: #0f172a;
              }
              .date {
                font-size: 13px;
                color: #64748b;
              }
              .segment {
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              .segment-header {
                font-size: 13.5px;
                font-weight: 700;
                color: #2563EB;
                margin-bottom: 4px;
              }
              .segment-text {
                font-size: 14.5px;
                line-height: 1.6;
                color: #334155;
              }
              .main-text {
                font-size: 14.5px;
                line-height: 1.7;
                color: #334155;
                text-align: justify;
              }
              @media print {
                body { padding: 0; }
                .segment { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${titleText}</h1>
              <div class="date">${dateLabel}</div>
            </div>
            <div class="transcript-content">
              ${transcriptHtml}
            </div>
          </body>
        </html>
      `;
      iframe.contentWindow.document.write(printHtml);
      iframe.contentWindow.document.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }

  function exportTranscriptDOCX() {
    const segments = analysis?.speaker_segments || [];
    const paragraphs = [
      new Paragraph({
        children: [
          new TextRun({ text: `Meeting Transcript: ${roomName}`, bold: true, size: 32 }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, color: "666666", size: 20 }),
        ],
        spacing: { after: 400 },
      }),
    ];
    if (segments.length > 0) {
      segments.forEach(seg => {
        const timeStr = seg.start !== undefined ? ` [${formatTimestamp(seg.start)}]` : '';
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${seg.speaker}${timeStr}`, bold: true, color: "2563EB", size: 22 }),
            ],
            spacing: { before: 200, after: 50 },
          })
        );
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: seg.text, size: 20 }),
            ],
            spacing: { after: 200 },
          })
        );
      });
    } else {
      const text = analysis?.transcript || analysis?.raw_transcript || 'No transcript available.';
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: text, size: 20 }),
          ],
        })
      );
    }
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${roomName}_transcript.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function exportSummaryPDF() {
    const summaryText = ad.summary || 'No summary available.';
    const items = ad.action_items || [];
    const isArabic = language === 'ar' || hasArabic(summaryText);

    let itemsHtml = '';
    if (items.length > 0) {
      items.forEach((item, i) => {
        const isObj = typeof item === 'object' && item !== null;
        const taskText = isObj ? item.task : item;
        const ownerText = isObj ? item.owner : '';
        const deadlineText = isObj ? item.deadline : '';
        const priorityText = isObj ? item.priority : '';
        const followUpText = isObj ? item.follow_up : '';

        const ownerLabel = language === 'ar' ? 'مسؤول:' : 'Owner:';
        const deadlineLabel = language === 'ar' ? 'الموعد:' : 'Deadline:';
        const priorityLabel = language === 'ar' ? 'الأولوية:' : 'Priority:';
        const followUpLabel = language === 'ar' ? 'متابعة:' : 'Follow up:';

        itemsHtml += `
          <li class="action-item" style="padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 10px; list-style: none;">
            <div class="task-text" style="font-size: 13.5px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">${escapeHtml(taskText)}</div>
            <div class="task-meta" style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span class="meta-tag" style="font-size: 11px; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;"><strong>${ownerLabel}</strong> ${escapeHtml(ownerText || (language === 'ar' ? 'غير محدد' : 'Unassigned'))}</span>
              ${deadlineText ? `<span class="meta-tag" style="font-size: 11px; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;"><strong>${deadlineLabel}</strong> ${escapeHtml(deadlineText)}</span>` : ''}
              ${priorityText ? `<span class="meta-tag" style="font-size: 11px; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;"><strong>${priorityLabel}</strong> ${escapeHtml(priorityText)}</span>` : ''}
              ${followUpText && followUpText !== 'None' ? `<span class="meta-tag" style="font-size: 11px; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;"><strong>${followUpLabel}</strong> ${escapeHtml(followUpText)}</span>` : ''}
            </div>
          </li>
        `;
      });
    } else {
      itemsHtml = `<p class="no-items" style="font-style: italic; color: #94a3b8; font-size: 13px;">${language === 'ar' ? 'لا توجد مهام مطلوبة.' : 'No action items found.'}</p>`;
    }

    const titleText = language === 'ar' ? `ملخص الاجتماع: ${roomName}` : `Meeting Summary: ${roomName}`;
    const dateLabel = language === 'ar' ? `التاريخ: ${new Date().toLocaleDateString('ar-EG')}` : `Date: ${new Date().toLocaleDateString()}`;
    const execSummaryTitle = language === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary';
    const actionItemsTitle = language === 'ar' ? 'المهام المطلوبة' : 'Action Items';

    const htmlContent = `
      <div style="font-family: ${isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif"}; padding: 25px; direction: ${isArabic ? 'rtl' : 'ltr'}; color: #1e293b; background: #fff;">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
        </style>
        <div class="header" style="border-bottom: 2px solid #2563EB; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 style="font-size: 22px; margin: 0 0 6px 0; color: #0f172a;">${titleText}</h1>
          <div class="date" style="font-size: 12px; color: #64748b;">${dateLabel}</div>
        </div>
        
        <h2 style="font-size: 16px; font-weight: 700; color: #2563EB; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${execSummaryTitle}</h2>
        <div class="summary-content" style="font-size: 13.5px; line-height: 1.6; color: #334155; text-align: justify;">${escapeHtml(summaryText).replace(/\n/g, '<br/>')}</div>
        
        <h2 style="font-size: 16px; font-weight: 700; color: #2563EB; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${actionItemsTitle}</h2>
        <ul style="padding: 0; margin: 0;">${itemsHtml}</ul>
      </div>
    `;

    try {
      const html2pdf = await loadHtml2Pdf();

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '790px';
      container.style.zIndex = '-9999';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const opt = {
        margin: 15,
        filename: `${roomName}_summary_actions.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: false,
          useCORS: true,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await new Promise(r => setTimeout(r, 300));
      if (document.fonts) {
        await document.fonts.ready;
      }

      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
    } catch (err) {
      console.warn('Failed to load html2pdf, falling back to browser print...', err);
      // Fallback: print via iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const printHtml = `
        <html>
          <head>
            <title>${titleText}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
              body {
                font-family: ${isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
                padding: 40px;
                color: #1e293b;
                direction: ${isArabic ? 'rtl' : 'ltr'};
                background: #fff;
                margin: 0;
              }
              .header {
                border-bottom: 2px solid #2563EB;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              h1 {
                font-size: 24px;
                margin: 0 0 8px 0;
                color: #0f172a;
              }
              .date {
                font-size: 13px;
                color: #64748b;
              }
              h2 {
                font-size: 18px;
                color: #2563EB;
                margin-top: 30px;
                margin-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 8px;
              }
              .summary-content {
                font-size: 14.5px;
                line-height: 1.7;
                color: #334155;
                text-align: justify;
              }
              ul {
                list-style: none;
                padding: 0;
                margin: 0;
              }
              .action-item {
                padding: 12px 16px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 12px;
              }
              .task-text {
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
                margin-bottom: 6px;
              }
              .task-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              .meta-tag {
                font-size: 11.5px;
                color: #475569;
                background: #e2e8f0;
                padding: 2px 8px;
                border-radius: 4px;
              }
              .no-items {
                font-style: italic;
                color: #94a3b8;
              }
              @media print {
                body { padding: 0; }
                .action-item { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${titleText}</h1>
              <div class="date">${dateLabel}</div>
            </div>
            
            <h2>${execSummaryTitle}</h2>
            <div class="summary-content">${escapeHtml(summaryText).replace(/\n/g, '<br/>')}</div>
            
            <h2>${actionItemsTitle}</h2>
            ${items.length > 0 ? `<ul>${itemsHtml}</ul>` : itemsHtml}
          </body>
        </html>
      `;
      iframe.contentWindow.document.write(printHtml);
      iframe.contentWindow.document.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }

  function exportSummaryDOCX() {
    const paragraphs = [
      new Paragraph({
        children: [
          new TextRun({ text: `Meeting Summary: ${roomName}`, bold: true, size: 32 }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, color: "666666", size: 20 }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Executive Summary", bold: true, color: "2563EB", size: 24 }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: ad.summary || 'No summary available.', size: 20 }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Action Items", bold: true, color: "2563EB", size: 24 }),
        ],
        spacing: { before: 200, after: 100 },
      }),
    ];
    const items = ad.action_items || [];
    if (items.length > 0) {
      items.forEach((item, i) => {
        const isObj = typeof item === 'object' && item !== null;
        const taskText = isObj ? item.task : item;
        const ownerText = isObj ? item.owner : '';
        const deadlineText = isObj ? item.deadline : '';
        const priorityText = isObj ? item.priority : '';
        const followUpText = isObj ? item.follow_up : '';
        const text = `[${ownerText || 'Unassigned'}] ${taskText}${deadlineText ? ` (Deadline: ${deadlineText})` : ''}${priorityText ? ` [Priority: ${priorityText}]` : ''}${followUpText && followUpText !== 'None' ? ` - Follow up: ${followUpText}` : ''}`;
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. ${text}`, size: 20 }),
            ],
            spacing: { after: 100 },
          })
        );
      });
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "No action items found.", italics: true, size: 20 }),
          ],
        })
      );
    }
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${roomName}_summary_actions.docx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleNativeShare() {
    const shareData = {
      title: `Echo Meet - ${roomName}`,
      text: `Meeting Summary for ${roomName}:\n${ad.summary || ''}`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => {
          setShareFeedback(language === 'ar' ? 'تمت المشاركة بنجاح!' : 'Shared successfully!');
          setTimeout(() => setShareFeedback(''), 3000);
        })
        .catch(err => {
          console.warn('Native share failed, copying link', err);
          copyShareLink();
        });
    } else {
      copyShareLink();
    }
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShareFeedback(language === 'ar' ? 'تم نسخ رابط الاجتماع إلى الحافظة!' : 'Meeting link copied to clipboard!');
        setTimeout(() => setShareFeedback(''), 3000);
      })
      .catch(() => {
        setShareFeedback(language === 'ar' ? 'فشل نسخ الرابط.' : 'Failed to copy link.');
        setTimeout(() => setShareFeedback(''), 3000);
      });
  }

  function copySummaryText() {
    navigator.clipboard.writeText(ad.summary || '')
      .then(() => {
        setShareFeedback(language === 'ar' ? 'تم نسخ الملخص إلى الحافظة!' : 'Summary copied to clipboard!');
        setTimeout(() => setShareFeedback(''), 3000);
      })
      .catch(() => { });
  }



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const ad = analysis?.analysis || {}
  const actionCount = (ad.action_items || []).length

  // ── Stats derived from analysis ───────────────────────────────────────────
  const wordCount = (analysis?.transcript || '').split(/\s+/).filter(Boolean).length
  const speakers = (analysis?.speakers || []).length || 1
  const duration = analysis?.duration || '--'

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = (text || input).trim()
    if (!msg || sending) return
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    setSending(true)
    try {
      const ctx = [
        analysis?.transcript ? `Transcript:\n${analysis.transcript}` : '',
        ad.summary ? `Summary:\n${ad.summary}` : '',
        ad.notes?.length ? `Notes:\n${ad.notes.join('\n')}` : '',
        ad.todo_list?.length ? `Tasks:\n${ad.todo_list.join('\n')}` : '',
        ad.action_items?.length ? `Action Items:\n${ad.action_items.join('\n')}` : '',
        ad.key_decisions?.length ? `Decisions:\n${ad.key_decisions.join('\n')}` : '',
      ].filter(Boolean).join('\n')

      const res = await fetch(`${API}/chat-with-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          meeting_id: meetingId,
          history: messages,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: language === 'ar' ? 'عذراً، حدث خطأ في الخادم.' : 'Sorry, a server error occurred.' }])
    } finally {
      setSending(false)
    }
  }

  function copyTranscript() {
    navigator.clipboard.writeText(analysis?.transcript || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!analysis) return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F111A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Icon d={ICONS.spark} size={32} className="text-blue-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'جاري تحميل التحليل...' : 'Loading analysis…'}</p>
      </div>
    </div>
  )

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`
      hidden md:flex flex-col bg-white dark:bg-[#0F111A] border-e border-gray-100 dark:border-white/10 transition-all duration-300 shrink-0
      ${collapsed ? 'w-16' : 'w-56'}
    `}>
      {/* New Meeting */}
      {!collapsed && (
        <div className="p-3">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
          >
            <Icon d={ICONS.newmeet} size={16} />
            {language === 'ar' ? 'اجتماع جديد' : 'New Meeting'}
          </button>
        </div>
      )}
      {collapsed && (
        <div className="p-3 flex justify-center">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all">
            <Icon d={ICONS.newmeet} size={16} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-1">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all relative
              ${activeTab === item.id
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}
            `}
          >
            {activeTab === item.id && (
              <div className="absolute start-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-e" />
            )}
            <Icon d={ICONS[item.icon]} size={17}
              className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'} />
            {!collapsed && (
              <>
                <span className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {item.id === 'chat' ? (language === 'ar' ? 'محادثات الذكاء الاصطناعي' : item.label) :
                    item.id === 'transcript' ? (language === 'ar' ? 'النص الكامل' : item.label) :
                      item.id === 'summary' ? (language === 'ar' ? 'الملخص' : item.label) :
                        item.id === 'tasks' ? (language === 'ar' ? 'المهام المطلوبة' : item.label) :
                          item.id === 'analytics' ? (language === 'ar' ? 'التحليلات' : item.label) :
                            item.label}
                </span>
                {item.badge === 'count' && actionCount > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {actionCount}
                  </span>
                )}
                {item.badge === 'new' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    New
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Settings Button (Moved strictly to bottom) */}
      <div className="border-t border-gray-100 dark:border-white/10 py-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all relative
            ${activeTab === 'settings'
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}
          `}
        >
          {activeTab === 'settings' && (
            <div className="absolute start-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-e" />
          )}
          <Icon d={ICONS.settings} size={17}
            className={activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400'} />
          {!collapsed && <span className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm border-t border-gray-100 dark:border-white/10 transition-colors"
      >
        <Icon d={ICONS.collapse} size={16} />
        {!collapsed && <span>{language === 'ar' ? 'طي القائمة' : 'Collapse'}</span>}
      </button>
    </aside>
  )

  // ── Analytics tab — dynamic insights and dashboard ────────────────────────
  const AnalyticsView = () => {
    // Calculate Speaker Talk-time
    const speakerSegments = analysis?.speaker_segments || [];
    const speakerWordCounts = {};
    let totalWords = 0;

    speakerSegments.forEach(seg => {
      const words = (seg.text || '').split(/\s+/).filter(Boolean).length;
      const spk = seg.speaker || (language === 'ar' ? 'مشارك غير معروف' : 'Unknown Speaker');
      speakerWordCounts[spk] = (speakerWordCounts[spk] || 0) + words;
      totalWords += words;
    });

    const speakerPercent = [];
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    if (totalWords > 0) {
      let idx = 0;
      Object.entries(speakerWordCounts).forEach(([spk, count]) => {
        const pct = Math.round((count / totalWords) * 100);
        speakerPercent.push({
          label: spk,
          pct,
          words: count,
          color: colors[idx % colors.length]
        });
        idx++;
      });
    } else {
      speakerPercent.push({
        label: analysis?.participant_name || (language === 'ar' ? 'المشارك' : 'Participant'),
        pct: 100,
        words: wordCount || 0,
        color: '#3b82f6'
      });
    }

    // Calculate Sentiment
    const rawTextForSentiment = (analysis?.transcript || analysis?.raw_transcript || '').toLowerCase();
    const positiveWords = [
      "great", "good", "excellent", "awesome", "perfect", "yes", "agree", "done", "succeed",
      "successful", "thanks", "thank", "nice", "love", "happy", "progress", "resolved", "solving", "solved",
      "ممتاز", "رائع", "جميل", "نعم", "موافق", "تمام", "شكرا", "شكر", "نجاح", "ناجح", "تمت", "تم", "موافقين", "حسنا", "صحيح"
    ];
    const negativeWords = [
      "bad", "error", "fail", "failed", "failure", "no", "disagree", "issue", "problem", "difficult",
      "delay", "delayed", "risk", "risks", "worry", "critical", "wrong", "mistake", "خطأ",
      "سيء", "فشل", "لا", "غير موافق", "مشكلة", "مشاكل", "صعب", "تأخير", "تأخر", "خطر", "مخاطر", "قلق"
    ];

    let posCount = 0;
    let negCount = 0;

    positiveWords.forEach(w => {
      let pos = rawTextForSentiment.indexOf(w);
      while (pos !== -1) {
        posCount++;
        pos = rawTextForSentiment.indexOf(w, pos + w.length);
      }
    });

    negativeWords.forEach(w => {
      let pos = rawTextForSentiment.indexOf(w);
      while (pos !== -1) {
        negCount++;
        pos = rawTextForSentiment.indexOf(w, pos + w.length);
      }
    });

    const totalSentimentWords = posCount + negCount;
    let positivePct = 60;
    let negativePct = 10;
    let neutralPct = 30;

    if (totalSentimentWords > 0) {
      positivePct = Math.round((posCount / totalSentimentWords) * 100);
      negativePct = Math.round((negCount / totalSentimentWords) * 100);
      if (positivePct > 80) {
        positivePct = 75;
        neutralPct = 20;
        negativePct = 5;
      } else if (negativePct > 80) {
        negativePct = 70;
        neutralPct = 20;
        positivePct = 10;
      } else {
        neutralPct = 100 - positivePct - negativePct;
        if (neutralPct < 0) {
          neutralPct = 0;
          positivePct = 100 - negativePct;
        }
      }
    }

    const sentimentSegments = [
      { pct: positivePct, color: '#22c55e', label: language === 'ar' ? 'إيجابي' : 'Positive' },
      { pct: neutralPct, color: '#eab308', label: language === 'ar' ? 'محايد' : 'Neutral' },
      { pct: negativePct, color: '#ef4444', label: language === 'ar' ? 'سلبي' : 'Negative' },
    ].filter(s => s.pct > 0);

    // Extract Keywords
    const wordsArray = (analysis?.transcript || analysis?.raw_transcript || '')
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3);

    const stopWords = new Set([
      'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'but',
      'with', 'are', 'as', 'was', 'were', 'be', 'at', 'have', 'had', 'has', 'from', 'by', 'an', 'they',
      'we', 'he', 'she', 'it', 'our', 'us', 'your', 'my', 'me', 'them', 'their', 'there', 'what', 'which',
      'who', 'how', 'why', 'where', 'when', 'will', 'would', 'should', 'could', 'about', 'more', 'some',
      'any', 'then', 'out', 'into', 'up', 'down', 'only', 'very', 'just', 'than', 'then', 'other', 'been',
      'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'هو', 'هي', 'هم', 'نحن', 'أنا',
      'أنت', 'كان', 'كانت', 'يكون', 'التي', 'الذي', 'الذين', 'أن', 'إن', 'ما', 'ولا', 'كذلك', 'هناك',
      'حيث', 'كيف', 'لماذا', 'متى', 'هنا', 'كل', 'بعض', 'تم', 'تمت', 'هذه'
    ]);

    const wordFreq = {};
    wordsArray.forEach(w => {
      if (!stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

    const sortedKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);

    const finalKeywords = sortedKeywords.length >= 3
      ? sortedKeywords
      : [...sortedKeywords, 'meeting', 'collaboration', 'discussion', 'actions'].slice(0, 8);

    let decisions = ad.key_decisions || [];
    if (decisions.length === 0 && ad.action_items && ad.action_items.length > 0) {
      decisions = ad.action_items.map(item => {
        const taskText = typeof item === 'object' && item !== null ? item.task : item;
        const ownerText = typeof item === 'object' && item !== null && item.owner && item.owner !== 'None' ? ` (${item.owner})` : '';
        return language === 'ar'
          ? `تم الاتفاق على تنفيذ: ${taskText}${ownerText}`
          : `It was agreed to execute: ${taskText}${ownerText}`;
      });
    }

    const isSingleSpeaker = speakers === 1;

    // Optional Timestamps Helper
    const getDecisionTimestamp = (idx, total) => {
      const totalSec = typeof duration === 'number' ? duration : 900;
      const segment = totalSec / (total + 1);
      const sec = Math.round(segment * (idx + 1));
      const mins = Math.floor(sec / 60);
      const secs = sec % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // AI Tone insight determination
    let sentimentInsight = '';
    if (positivePct >= 65) {
      sentimentInsight = language === 'ar'
        ? 'تميز الاجتماع بنبرة إيجابية وتوافق كبير في الآراء، مما يعكس بيئة عمل تعاونية وبناءة بين الحاضرين.'
        : 'The meeting maintained a positive and constructive tone with high agreement levels and alignment among participants.';
    } else if (negativePct >= 35) {
      sentimentInsight = language === 'ar'
        ? 'لوحظ وجود بعض التباين في وجهات النظر أو نقاط القلق. يُنصح بمتابعة المهام العالقة لتوضيح الأمور.'
        : 'There was visible concern or conflicting opinions on certain items. Following up on open tasks will help clarify unresolved points.';
    } else {
      sentimentInsight = language === 'ar'
        ? 'سادت نبرة متوازنة وموضوعية طوال النقاش، مع التركيز على تبادل المعلومات ومراجعة العمل بشكل هادئ.'
        : 'The discussion maintained a balanced, neutral, and objective tone, focusing primarily on information sharing and steady progress.';
    }

    // AI meeting observations for the bottom card
    const focusText = language === 'ar'
      ? 'تركز النقاش بشكل أساسي على مراجعة حالة المشروع الحالية وتحديد خطوات العمل القادمة.'
      : 'The meeting centered around aligning project goals, outlining core milestones, and coordinating next steps.';

    const engagementText = !isSingleSpeaker
      ? (language === 'ar'
        ? `تفاعل نشط ومتوازن بين ${speakers} متحدثين، مما يعكس تعاوناً وتنسيقاً عاليين بين أعضاء الفريق.`
        : `Active collaboration and balanced participation across all ${speakers} speakers during the discussion.`)
      : (language === 'ar'
        ? 'تقديم معلوماتي متكامل ومستمر من الحاضر لعرض التفاصيل وتوضيح الرؤية بشكل تفصيلي.'
        : 'A focused solo presentation outlining structural details and delivering clear contextual information.');

    const productivityText = actionCount > 0 || decisions.length > 0
      ? (language === 'ar'
        ? `اجتماع عالي الإنتاجية أسفر عن تحديد ${actionCount} مهام عمل واتخاذ ${decisions.length} قرارات رئيسية.`
        : `A highly productive session leading to ${actionCount} action items assigned and ${decisions.length} decisions finalized.`)
      : (language === 'ar'
        ? 'اجتماع تنسيقي لمشاركة المعلومات ومراجعة التقدم دون وجود قرارات أو مهام معلقة.'
        : 'An alignment session focused on information exchange and general review with no pending assignments.');

    return (
      <div className="p-6 md:p-8 space-y-8 overflow-y-auto h-full w-full bg-[#f8fafc] dark:bg-[#0F111A] transition-colors duration-300">
        {/* Header Title inside panel */}
        <div className="text-start mb-2">
          <h2 className="text-xl font-bold text-[#1E1A3C] dark:text-white mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {language === 'ar' ? 'التحليلات والإحصاءات' : 'Analytics'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {language === 'ar' ? 'رؤى الذكاء الاصطناعي ونظرة عامة على اجتماعك.' : 'AI insights and overview of your meeting.'}
          </p>
        </div>

        {/* 4 Top Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: language === 'ar' ? 'المدة' : 'Duration',
              value: typeof duration === 'number' ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : duration,
              sub: language === 'ar' ? `${typeof duration === 'number' ? Math.round(duration / 60) : duration} دقيقة` : `${typeof duration === 'number' ? Math.round(duration / 60) : duration} minutes`,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20'
            },
            {
              label: language === 'ar' ? 'المتحدثين' : 'Speakers',
              value: speakers,
              sub: language === 'ar' ? `${speakers} مشارك` : `${speakers} ${speakers === 1 ? 'participant' : 'participants'}`,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm-6 3a2 2 0 110-4 2 2 0 010 4zm-3.356 3.857a5.002 5.002 0 00-4.644 0A5 5 0 002 18v2h7v-2a3 3 0 00-.356-1.857z" />
                </svg>
              ),
              color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20'
            },
            {
              label: language === 'ar' ? 'المهام المطلوبة' : 'Action Items',
              value: actionCount,
              sub: language === 'ar' ? 'مهام مفتوحة' : 'Open items',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              color: 'text-green-500 bg-green-500/10 dark:bg-green-500/20 border-green-500/20'
            },
            {
              label: language === 'ar' ? 'القرارات الرئيسية' : 'Key Decisions',
              value: decisions.length,
              sub: language === 'ar' ? 'تم استخراجها' : 'AI extracted',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20'
            }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-[#0B0F19] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 flex items-center gap-4 transition-all duration-200">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="flex-1 min-w-0 text-start">
                <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</span>
                <span className="block text-2xl font-bold text-[#1E1A3C] dark:text-white mt-1 leading-none">{stat.value}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1.5">{stat.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2-Column Section (Speaker Card & Sentiment Analysis) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Speaker Info or Distribution */}
          <div className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[350px] transition-all duration-200">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider text-start">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {isSingleSpeaker
                  ? (language === 'ar' ? 'معلومات المشارك' : 'Participant Info')
                  : (language === 'ar' ? 'توزيع وقت التحدث للمشاركين' : 'Speaker Talk-Time Distribution')}
              </h3>

              {isSingleSpeaker ? (
                <div className="flex flex-col items-center justify-center text-center py-6 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-6 flex-1">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold mb-4 shadow-sm">
                    {(analysis?.participant_name || localStorage.getItem('pname') || 'U')[0].toUpperCase()}
                  </div>
                  <h4 className="text-base font-bold text-[#1E1A3C] dark:text-white">
                    {analysis?.participant_name || localStorage.getItem('pname') || (language === 'ar' ? 'مشارك' : 'Participant')}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
                    {language === 'ar' ? 'متحدث منفرد' : 'Solo Presenter'}
                  </p>
                  <div className="mt-4 px-4 py-2 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
                    {wordCount.toLocaleString()} {language === 'ar' ? 'كلمة منطوقة' : 'words spoken'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed max-w-xs">
                    {language === 'ar'
                      ? 'تم إجراء هذا الاجتماع بواسطة متحدث واحد فقط. تم تسجيل وتحليل جميع المدخلات الصوتية لهذا المشارك.'
                      : 'This meeting was conducted by a single speaker. All spoken audio and derived insights are attributed to this participant.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                  <div className="relative flex-shrink-0">
                    <Donut size={140} stroke={18} segments={speakerPercent} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">{speakers}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'متحدثين' : 'Speakers'}</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1 w-full">
                    {speakerPercent.map((spk, idx) => (
                      <div key={idx} className="flex flex-col text-xs text-start">
                        <div className="flex items-center justify-between font-semibold mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: spk.color }} />
                            <span className="text-gray-700 dark:text-gray-300 font-bold">{spk.label}</span>
                          </div>
                          <span className="text-gray-900 dark:text-white font-bold">{spk.pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${spk.pct}%`, background: spk.color }} />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{spk.words.toLocaleString()} {language === 'ar' ? 'كلمة' : 'words'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[350px] transition-all duration-200">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider text-start">
                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {language === 'ar' ? 'تحليل المشاعر والنبرة العامة' : 'Sentiment & Tone Analysis'}
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                <div className="relative flex-shrink-0">
                  <Donut size={140} stroke={18} segments={sentimentSegments} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{positivePct}%</span>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'إيجابي' : 'Positive'}</span>
                  </div>
                </div>
                <div className="space-y-3.5 flex-1 w-full">
                  {sentimentSegments.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-50 dark:border-white/5 pb-2">
                      <div className="flex items-center gap-2 text-start">
                        <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                        <span className="font-bold text-gray-700 dark:text-gray-300">{s.label}</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 text-xs text-start leading-relaxed flex items-start gap-2.5">
              <svg className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-bold text-[#1E1A3C] dark:text-white block mb-1">
                  {language === 'ar' ? 'رؤية الذكاء الاصطناعي:' : 'AI Tone Observation:'}
                </span>
                {sentimentInsight}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Section (Decisions Made) - Full-Width (col-span-2) */}
        <div className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-200">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider text-start">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {language === 'ar' ? 'القرارات التي تم اتخاذها' : 'Decisions Made Overview'}
          </h3>

          {decisions.length > 0 ? (
            <div className="space-y-4">
              {decisions.map((dec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-gray-100/80 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors duration-200 text-start"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 mt-0.5 border border-green-500/10">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 break-words" dir="auto">
                      {dec}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 shrink-0 select-none">
                    {getDecisionTimestamp(i, decisions.length)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                {language === 'ar' ? 'لم يتم العثور على قرارات صريحة.' : 'No explicit decisions found.'}
              </p>
            </div>
          )}
        </div>

        {/* AI Meeting Insights Card */}
        <div className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm w-full transition-all duration-200">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider text-start">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {language === 'ar' ? 'رؤى وتوصيات الذكاء الاصطناعي للاجتماع' : 'AI Meeting Insights'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Item 1: Focus */}
            <div className="flex items-start gap-4 text-start">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1A3C] dark:text-white">
                  {language === 'ar' ? 'تركيز الاجتماع' : 'Meeting Focus'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {focusText}
                </p>
              </div>
            </div>

            {/* Item 2: Engagement */}
            <div className="flex items-start gap-4 text-start">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1A3C] dark:text-white">
                  {language === 'ar' ? 'التفاعل والمشاركة' : 'Engagement'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {engagementText}
                </p>
              </div>
            </div>

            {/* Item 3: Productivity */}
            <div className="flex items-start gap-4 text-start">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 border border-green-500/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E1A3C] dark:text-white">
                  {language === 'ar' ? 'الإنتاجية والمخرجات' : 'Productivity'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {productivityText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat tab ──────────────────────────────────────────────────────────────
  const ChatView = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F111A]">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/10">
        <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Icon d={ICONS.spark} size={14} className="text-white" />
          </div>
          {language === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}
        </h2>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          <Icon d={ICONS.dots} size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center gap-1.5 text-start">
              <Icon d={ICONS.spark} size={12} className="text-blue-400" />
              {language === 'ar' ? 'أسئلة مقترحة' : 'Suggested Questions'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-2 text-start px-3 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-600 dark:text-gray-300 font-medium hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                  <Icon d={ICONS[s.icon]} size={13} className="text-gray-400 shrink-0" />
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Smart Prompts */}
        {messages.length === 1 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center gap-1.5 text-start">
              <Icon d={ICONS.spark} size={12} className="text-purple-400" />
              {language === 'ar' ? 'أوامر ذكية' : 'Smart Prompts'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {SMART_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.label)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                  <Icon d={ICONS[p.icon]} size={13} className="text-gray-400" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon d={ICONS.spark} size={14} className="text-blue-600" />
              </div>
            )}
            <div className="max-w-[78%]">
              <div className={`text-[11px] font-semibold mb-1 text-gray-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'bot' ? (language === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant') : (language === 'ar' ? 'أنت' : 'You')}
                <span className="ms-1.5 font-normal text-gray-300">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`px-4 py-3 rounded-2xl text-base md:text-lg leading-relaxed whitespace-pre-wrap text-start ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/10 rounded-tl-sm font-medium'
                }`}>
                {msg.content}
              </div>
              {msg.role === 'bot' && (
                <div className="flex items-center gap-1 mt-1.5 justify-start">
                  {['👍', '👎'].map(emoji => (
                    <button key={emoji} className="text-gray-300 hover:text-gray-500 text-sm transition-colors">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon d={ICONS.user} size={14} className="text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <Icon d={ICONS.spark} size={14} className="text-blue-600" />
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
        <div className="relative">
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={language === 'ar' ? 'اسأل مساعد الذكاء الاصطناعي...' : 'Ask follow ups & save prompts to reuse...'}
            className="w-full bg-white dark:bg-[#0F111A] border border-gray-200 dark:border-white/10 rounded-2xl py-3 ps-4 pe-12 text-sm dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                       placeholder-gray-400 transition-all shadow-sm"
          />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
            className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center
                       bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-white/5 text-white rounded-xl
                       transition-all shadow-sm">
            {sending
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Icon d={ICONS.send} size={15} />}
          </button>
        </div>
        <div className="flex gap-2 mt-2.5 justify-start">
          <button className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
            {language === 'ar' ? '+ حفظ كأمر' : '+ Save as prompt'}
          </button>
          <button className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
            {language === 'ar' ? 'أوامري ▾' : 'My prompts ▾'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Transcript tab ────────────────────────────────────────────────────────
  const TranscriptView = () => {
    const filteredSegments = (analysis.speaker_segments || []).filter(seg => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return seg.speaker.toLowerCase().includes(q) || seg.text.toLowerCase().includes(q);
    });

    const rawText = analysis.transcript || analysis.raw_transcript || (language === 'ar' ? 'النص غير متوفر.' : 'No transcript available.');
    const matchesSearch = !searchQuery.trim() || rawText.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div className="p-6 space-y-4 overflow-y-auto h-full text-start">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{language === 'ar' ? 'النص الكامل' : 'Full Transcript'}</h2>
          <button onClick={copyTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
            <Icon d={copied ? ICONS.check : ICONS.copy} size={13} />
            {copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ' : 'Copy')}
          </button>
        </div>
        <div className="space-y-3">
          {(analysis.speaker_segments || []).length > 0 ? (
            filteredSegments.length > 0 ? (
              filteredSegments.map((seg, i) => (
                <div key={i} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm text-start">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-450 tracking-wide">
                      {highlightText(seg.speaker, searchQuery)}
                    </span>
                    {seg.start !== undefined && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono font-bold bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-white/10">
                        ⏱ {formatTimestamp(seg.start)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 dark:text-gray-100 text-base md:text-lg font-medium leading-relaxed mt-1" dir="auto">
                    {highlightText(seg.text, searchQuery)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6">{language === 'ar' ? 'لم يتم العثور على أجزاء مطابقة للنص.' : 'No matching transcript segments found.'}</p>
            )
          ) : (
            matchesSearch ? (
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-sm text-start">
                <p className="text-gray-800 dark:text-gray-100 text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap" dir="auto">
                  {highlightText(rawText, searchQuery)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6">{language === 'ar' ? 'لم يتم العثور على نص مطابق.' : 'No matching transcript text found.'}</p>
            )
          )}
        </div>
      </div>
    );
  }

  // ── Summary tab ───────────────────────────────────────────────────────────
  const SummaryView = () => {
    const summaryText = ad.summary || (language === 'ar' ? 'لا يوجد ملخص متاح.' : 'No summary available.');
    const filteredNotes = (ad.notes || []).filter(note => {
      if (!searchQuery.trim()) return true;
      return note.toLowerCase().includes(searchQuery.toLowerCase());
    });

    let keyDecisions = ad.key_decisions || [];
    if (keyDecisions.length === 0 && ad.action_items && ad.action_items.length > 0) {
      keyDecisions = ad.action_items.map(item => {
        const taskText = typeof item === 'object' && item !== null ? item.task : item;
        const ownerText = typeof item === 'object' && item !== null && item.owner && item.owner !== 'None' ? ` (${item.owner})` : '';
        return language === 'ar'
          ? `تم الاتفاق على تنفيذ: ${taskText}${ownerText}`
          : `It was agreed to execute: ${taskText}${ownerText}`;
      });
    }
    const filteredDecisions = keyDecisions.filter(dec => {
      if (!searchQuery.trim()) return true;
      return dec.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
      <div className="p-6 space-y-5 overflow-y-auto h-full text-start">
        {(!searchQuery.trim() || summaryText.toLowerCase().includes(searchQuery.toLowerCase())) && (
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm text-start">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Icon d={ICONS.summary} size={15} /> {language === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary'}
            </h3>
            <p className="text-gray-800 dark:text-gray-100 text-base md:text-lg font-medium leading-relaxed" dir="auto">
              {highlightText(summaryText, searchQuery)}
            </p>
          </div>
        )}

        {filteredNotes.length > 0 && (
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm text-start">
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
              <Icon d={ICONS.insights} size={15} /> {language === 'ar' ? 'ملاحظات هامة' : 'Key Notes'}
            </h3>
            <ul className="space-y-2">
              {filteredNotes.map((note, i) => (
                <li key={i} className="flex gap-2.5 text-base md:text-lg font-medium text-gray-800 dark:text-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <span dir="auto">{highlightText(note, searchQuery)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filteredDecisions.length > 0 && (
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm text-start">
            <h3 className="text-sm font-bold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <Icon d={ICONS.check} size={15} /> {language === 'ar' ? 'القرارات الرئيسية' : 'Key Decisions'}
            </h3>
            <ul className="space-y-2">
              {filteredDecisions.map((dec, i) => (
                <li key={i} className="flex gap-2.5 text-base md:text-lg font-medium text-gray-800 dark:text-gray-100 text-start">
                  <Icon d={ICONS.check} size={13} className="text-green-500 shrink-0 mt-0.5" />
                  <span dir="auto">{highlightText(dec, searchQuery)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ── Tasks tab ─────────────────────────────────────────────────────────────
  const TasksView = () => {
    const filteredActionItems = (ad.action_items || []).filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (typeof item === 'object' && item !== null) {
        return (
          (item.task || '').toLowerCase().includes(q) ||
          (item.owner || '').toLowerCase().includes(q) ||
          (item.deadline || '').toLowerCase().includes(q) ||
          (item.priority || '').toLowerCase().includes(q) ||
          (item.follow_up || '').toLowerCase().includes(q)
        );
      }
      return String(item).toLowerCase().includes(q);
    });

    const filteredTodo = (ad.todo_list || []).filter(task => {
      if (!searchQuery.trim()) return true;
      return task.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
      <div className="p-6 space-y-5 overflow-y-auto h-full text-start">
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm text-start">
          <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
            <Icon d={ICONS.tasks} size={15} /> {language === 'ar' ? 'المهام المطلوبة' : 'Action Items'}
            {filteredActionItems.length > 0 && (
              <span className="ms-auto px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-bold">
                {filteredActionItems.length}
              </span>
            )}
          </h3>
          {filteredActionItems.length > 0 ? (
            <div className="space-y-3">
              {filteredActionItems.map((item, i) => {
                const isObj = typeof item === 'object' && item !== null;
                const taskText = isObj ? item.task : item;
                const ownerText = isObj ? item.owner : '';
                const deadlineText = isObj ? item.deadline : '';
                const priorityText = isObj ? item.priority : '';
                const followUpText = isObj ? item.follow_up : '';
                const statusText = isObj ? item.status : 'Pending';

                const statusLabel = statusText === 'Pending' ? (language === 'ar' ? 'قيد الانتظار' : 'Pending') : statusText;

                return (
                  <div key={i} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm group hover:border-orange-300 transition-all text-start">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {ownerText && ownerText !== 'None' && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          👤 {highlightText(ownerText, searchQuery)}
                        </span>
                      )}
                      {deadlineText && deadlineText !== 'None' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                          📅 {highlightText(deadlineText, searchQuery)}
                        </span>
                      )}
                      {priorityText && priorityText !== 'None' && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priorityText.toLowerCase() === 'high' ? 'bg-orange-100 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400' :
                          priorityText.toLowerCase() === 'medium' ? 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-750 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                          }`}>
                          ⚡ {highlightText(
                            priorityText.toLowerCase() === 'high' ? (language === 'ar' ? 'عالية' : 'High') :
                              priorityText.toLowerCase() === 'medium' ? (language === 'ar' ? 'متوسطة' : 'Medium') :
                                (language === 'ar' ? 'منخفضة' : 'Low'),
                            searchQuery
                          )} {language === 'ar' ? 'أولوية' : 'Priority'}
                        </span>
                      )}
                      <span className="ms-auto px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-650 dark:text-gray-300 text-xs font-medium">
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-gray-850 dark:text-gray-100" dir="auto">
                      {highlightText(taskText, searchQuery)}
                    </p>
                    {followUpText && followUpText !== 'None' && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-white/10 pt-2">
                        <span className="font-bold text-gray-750 dark:text-gray-300">{language === 'ar' ? 'المتابعة:' : 'Follow-up:'}</span> {highlightText(followUpText, searchQuery)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/20">
              <Icon d={ICONS.tasks} size={36} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{language === 'ar' ? 'لم يتم العثور على مهام.' : 'No action items found.'}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{language === 'ar' ? 'حاول البحث عن شيء آخر أو تحقق من التصنيفات.' : 'Try searching for something else or check your filters.'}</p>
            </div>
          )}
        </div>

        {filteredTodo.length > 0 && (
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm text-start">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Icon d={ICONS.chat} size={15} /> {language === 'ar' ? 'قائمة المهام' : 'Todo List'}
            </h3>
            <div className="space-y-2">
              {filteredTodo.map((task, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 group hover:border-blue-200 transition-all text-start">
                  <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-white/20 group-hover:border-blue-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors" />
                  <span className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-100" dir="auto">{highlightText(task, searchQuery)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Settings View ──────────────────────────────────────────────────────────
  const SettingsView = () => (
    <div className="p-6 space-y-6 max-w-2xl overflow-y-auto h-full text-start">
      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Icon d={ICONS.user} size={18} className="text-blue-600" />
          {language === 'ar' ? 'إعدادات الملف الشخصي' : 'Profile Settings'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {language === 'ar' ? 'الاسم المعروض' : 'Display Name'}
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={async () => {
              await saveSetting('pname', profileName);
              await saveSetting('pemail', profileEmail);
              setSettingsStatus(language === 'ar' ? 'تم حفظ الملف الشخصي بنجاح!' : 'Profile saved successfully!');
              setTimeout(() => setSettingsStatus(''), 3000);
            }}
            className="btn-cta text-xs px-4 py-2"
          >
            {language === 'ar' ? 'حفظ الملف الشخصي' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-sm animate-fade-in">
        <h2 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Icon d={ICONS.settings} size={18} className="text-purple-600" />
          {language === 'ar' ? 'تفضيلات التطبيق' : 'Application Preferences'}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'لغة الواجهة' : 'Interface Language'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{language === 'ar' ? 'اختر لغة واجهة المستخدم المفضلة لديك.' : 'Choose your preferred UI language.'}</p>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-semibold dark:text-white focus:outline-none"
            >
              <option value="en" className="dark:bg-[#121214]">{language === 'ar' ? 'الإنجليزية (English)' : 'English'}</option>
              <option value="ar" className="dark:bg-[#121214]">العربية (Arabic)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'لغة النسخ الصوتي' : 'Transcription Language'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{language === 'ar' ? 'حدد اللغة المستخدمة في الحديث لتسهيل تحويلها إلى نص.' : 'Select the spoken language to transcribe.'}</p>
            </div>
            <select
              value={transcriptionLanguage}
              onChange={(e) => {
                setTranscriptionLanguage(e.target.value);
                saveSetting('transcription_language', e.target.value);
              }}
              className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-semibold dark:text-white focus:outline-none"
            >
              <option value="auto" className="dark:bg-[#121214]">{language === 'ar' ? 'تحديد تلقائي' : 'Auto Detect'}</option>
              <option value="ar" className="dark:bg-[#121214]">العربية (Arabic)</option>
              <option value="en" className="dark:bg-[#121214]">الإنجليزية (English)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'المظهر البصري' : 'Visual Theme'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{language === 'ar' ? 'التبديل بين الوضع الفاتح والداكن.' : 'Switch between light and dark modes.'}</p>
            </div>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-semibold dark:text-white focus:outline-none"
            >
              <option value="light" className="dark:bg-[#121214]">{language === 'ar' ? 'الوضع الفاتح (Light)' : 'Light Mode'}</option>
              <option value="dark" className="dark:bg-[#121214]">{language === 'ar' ? 'الوضع الداكن (Dark)' : 'Dark Mode'}</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{language === 'ar' ? 'إشعارات سطح المكتب' : 'Desktop Notifications'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{language === 'ar' ? 'تلقي تنبيهات بالمهام والإجراءات.' : 'Receive alert notifications for actions.'}</p>
            </div>
            <button
              onClick={() => {
                const newVal = !notifications;
                setNotifications(newVal);
                saveSetting('notifications', newVal);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${notifications ? 'end-0.5' : 'start-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {settingsStatus && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-xl px-4 py-2.5 text-green-700 dark:text-green-400 text-xs font-semibold animate-pulse">
          {settingsStatus}
        </div>
      )}
    </div>
  )

  // ── Placeholder for other tabs ────────────────────────────────────────────
  const PlaceholderView = ({ tab }) => (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white dark:bg-[#0F111A]">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
        <Icon d={ICONS[tab.icon] || ICONS.spark} size={24} className="text-blue-400 dark:text-blue-500" />
      </div>
      <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
        {tab.id === 'chat' ? (language === 'ar' ? 'محادثات الذكاء الاصطناعي' : tab.label) :
          tab.id === 'transcript' ? (language === 'ar' ? 'النص الكامل' : tab.label) :
            tab.id === 'summary' ? (language === 'ar' ? 'الملخص' : tab.label) :
              tab.id === 'tasks' ? (language === 'ar' ? 'المهام المطلوبة' : tab.label) :
                tab.id === 'analytics' ? (language === 'ar' ? 'التحليلات' : tab.label) :
                  tab.label} — {language === 'ar' ? 'قريباً' : 'coming soon'}
      </p>
    </div>
  )

  const getTabContent = () => {
    switch (activeTab) {
      case 'chat': return ChatView();
      case 'transcript': return TranscriptView();
      case 'summary': return SummaryView();
      case 'tasks': return TasksView();
      case 'analytics': return AnalyticsView();
      case 'settings': return SettingsView();
      default: return <PlaceholderView tab={activeNav || NAV[0]} />;
    }
  }

  const activeNav = NAV.find(n => n.id === activeTab)
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#0F111A] text-gray-800 dark:text-gray-100 overflow-hidden" dir={dir}>

      {/* ── Top header ───────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0F111A] border-b border-gray-100 dark:border-white/10 z-30">
        {/* Left: logo + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Echo Meet" className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-800 dark:text-white hidden sm:block text-sm">
              Echo <span className="text-blue-600">Meet</span>
            </span>
          </Link>
          <span className="text-gray-300 dark:text-gray-700 hidden sm:block">›</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium hidden sm:block">
            {language === 'ar' ? 'اجتماعاتي' : 'My Meetings'}
          </span>
          <span className="text-gray-300 dark:text-gray-700 hidden sm:block">›</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
            {roomName}
          </span>
        </div>

        {/* Center: search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 w-56">
          <Icon d={ICONS.search} size={14} className="text-gray-400 dark:text-gray-500" />
          <input
            placeholder={language === 'ar' ? 'بحث في الاجتماع...' : 'Search in meeting…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-gray-600 dark:text-gray-300 outline-none placeholder-gray-400 dark:placeholder-gray-600 w-full animate-fade-in"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs">×</button>
          )}
        </div>

        {/* Right: actions + user */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <Icon d={ICONS.bell} size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
          <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <Icon d={ICONS.print} size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={() => {
              if (activeTab === 'transcript') exportTranscriptPDF();
              else exportSummaryPDF();
            }}
            title={language === 'ar' ? 'تحميل كـ PDF' : 'Download PDF'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <Icon d={ICONS.download} size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={() => {
              if (activeTab === 'transcript') exportTranscriptDOCX();
              else exportSummaryDOCX();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Icon d={ICONS.download} size={13} />
            {language === 'ar' ? 'ملف Word' : 'Word'}
          </button>
          <div className="flex items-center gap-2 ps-2 border-s border-gray-100 dark:border-white/10 ms-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {(analysis?.participant_name || 'U')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block text-start">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{analysis?.participant_name || 'User'}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">user@email.com</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        <Sidebar />

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/30 dark:bg-[#0F111A]">
          {/* Content header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white dark:bg-[#0F111A] border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                <Icon d={ICONS.collapse} size={16} className="text-gray-400 dark:text-gray-500" />
              </button>
              <h1 className="text-sm font-bold text-gray-800 dark:text-white">
                {activeNav?.id === 'chat' ? (language === 'ar' ? 'محادثات الذكاء الاصطناعي' : activeNav?.label) :
                  activeNav?.id === 'transcript' ? (language === 'ar' ? 'النص الكامل' : activeNav?.label) :
                    activeNav?.id === 'summary' ? (language === 'ar' ? 'الملخص' : activeNav?.label) :
                      activeNav?.id === 'tasks' ? (language === 'ar' ? 'المهام المطلوبة' : activeNav?.label) :
                        activeNav?.id === 'analytics' ? (language === 'ar' ? 'التحليلات' : activeNav?.label) :
                          activeNav?.id === 'settings' ? (language === 'ar' ? 'الإعدادات' : 'Settings') :
                            activeNav?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {meetingId && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? (language === 'ar' ? 'جاري التحديث...' : 'Refreshing...') : (language === 'ar' ? 'تحديث' : 'Refresh')}
                </button>
              )}
              <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                <Icon d={ICONS.share} size={13} /> {language === 'ar' ? 'مشاركة' : 'Share'}
              </button>

              <button
                onClick={() => {
                  if (activeTab === 'transcript') exportTranscriptPDF();
                  else exportSummaryPDF();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                title="Export PDF"
              >
                <Icon d={ICONS.download} size={13} /> {language === 'ar' ? 'ملف PDF' : 'PDF'}
              </button>

              <button
                onClick={() => {
                  if (activeTab === 'transcript') exportTranscriptDOCX();
                  else exportSummaryDOCX();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                title="Export Word"
              >
                <Icon d={ICONS.download} size={13} /> {language === 'ar' ? 'ملف Word' : 'Word'}
              </button>

              {activeTab === 'transcript' && (
                <button
                  onClick={exportTranscriptTXT}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                  title="Export TXT"
                >
                  <Icon d={ICONS.download} size={13} /> {language === 'ar' ? 'نص بسيط' : 'TXT'}
                </button>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#0F111A]">
            {getTabContent()}
          </div>
        </main>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1E1A3C] w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-white/10"
            style={{ animation: 'fadeInScale 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1E1A3C] dark:text-white">
                {language === 'ar' ? 'مشاركة محتوى الاجتماع' : 'Share Meeting Content'}
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all"
              >
                <div className="text-start">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {language === 'ar' ? 'المشاركة الأصلية / نسخ الرابط' : 'Native Share / Copy Link'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {language === 'ar' ? 'مشاركة رابط الاجتماع باستخدام خيارات النظام.' : 'Share meeting link using system options.'}
                  </p>
                </div>
                <Icon d={ICONS.share} size={18} className="text-blue-500" />
              </button>

              <button
                onClick={copyTranscript}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all"
              >
                <div className="text-start">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {language === 'ar' ? 'نسخ النص الكامل' : 'Copy Full Transcript'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {language === 'ar' ? 'نسخ نص المحادثة الكاملة.' : 'Copy the complete conversation transcript text.'}
                  </p>
                </div>
                <Icon d={ICONS.copy} size={18} className="text-purple-500" />
              </button>

              <button
                onClick={copySummaryText}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all"
              >
                <div className="text-start">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {language === 'ar' ? 'نسخ الملخص التنفيذي' : 'Copy Executive Summary'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {language === 'ar' ? 'نسخ نص الملخص إلى الحافظة.' : 'Copy the summary text to your clipboard.'}
                  </p>
                </div>
                <Icon d={ICONS.summary} size={18} className="text-green-500" />
              </button>
            </div>

            {shareFeedback && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 text-[#2563EB] dark:text-blue-400 text-xs font-semibold px-4 py-2.5 rounded-xl text-center">
                {shareFeedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
