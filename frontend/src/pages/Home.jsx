import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RoomModal from '../components/RoomModal'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15.536 8.464a5 5 0 010 7.072M12 18.657A9 9 0 1112 5.343m0 13.314V12m0 0V5.343" />
      </svg>
    ),
    title: 'AI Real-Time Noise Cancellation',
    desc: 'Removes background sounds like traffic, typing, and static with advanced AI algorithms for crystal-clear audio.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'AI Meeting Assistant',
    desc: 'Real-time transcription, speaker labels, and smart meeting summaries powered by advanced AI.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Smart Collaboration Tools',
    desc: 'High-quality audio/video, chat, screen sharing, and interactive whiteboard for seamless teamwork.',
  },
]

const steps = [
  {
    n: 1,
    title: 'Create or Join a Meeting',
    desc: 'Start a new meeting instantly or join with a simple link. No downloads required.',
  },
  {
    n: 2,
    title: 'AI Filters Noise in Real Time',
    desc: 'Our AI automatically identifies and removes background noise while you speak.',
  },
  {
    n: 3,
    title: 'Receive Summary & Transcripts',
    desc: 'Get instant AI-generated transcripts and meeting summaries after each call.',
  },
]

const overviewTabs = [
  {
    id: 'room',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Meeting Room Interface',
  },
  {
    id: 'transcript',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'AI Transcript',
  },
  {
    id: 'whiteboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Whiteboard',
  },
  {
    id: 'chat',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: 'Chat Panel',
  },
]

const audiences = [
  {
    icon: '🎓',
    title: 'Education',
    desc: 'Perfect for online classes, lectures, and student collaboration with AI note-taking.',
  },
  {
    icon: '💼',
    title: 'Business Teams',
    desc: 'Run efficient stand-ups, client calls, and project reviews with auto-generated action items.',
  },
  {
    icon: '🎨',
    title: 'Creative Teams',
    desc: 'Brainstorm ideas freely using the whiteboard and chat while AI captures everything.',
  },
  {
    icon: '🏥',
    title: 'Healthcare',
    desc: 'Secure, noise-free telehealth consultations with accurate AI transcription.',
  },
]

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('room')
  const navigate = useNavigate()

  function handleConfirm({ meeting_id, room_name, room_url, participantName }) {
    setShowModal(false)
    const nameParam = participantName ? `&pname=${encodeURIComponent(participantName)}` : ''
    navigate(`/meeting/${room_name}?url=${encodeURIComponent(room_url)}&meetingId=${meeting_id}${nameParam}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F111A] font-sans overflow-x-hidden transition-colors duration-300">
      <Navbar onStartMeeting={() => setShowModal(true)} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-40 md:pt-48 pb-20 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left copy */}
          <div className="flex-1 text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#1E1A3C] dark:text-white mb-6">
              Meetings That Work <br className="hidden md:block" /> for You
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg leading-relaxed max-w-md mb-10">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Never Miss What Matters Again.</span><br/>
              Your meetings, transformed by AI into summaries, highlights, and easy-to-understand visuals—so every detail counts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                id="hero-start-meeting"
                onClick={() => setShowModal(true)}
                className="btn-cta text-base px-8 py-4"
              >
                Start Free Meeting
              </button>
              <button className="btn-outline flex items-center justify-center gap-2 text-base px-6 py-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Free for unlimited meetings
              </span>
            </div>
          </div>

          {/* Right hero card */}
          <div className="flex-1 w-full max-w-lg">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]"
                 style={{ aspectRatio: '4/3' }}>


              {/* Background Image */}
              <img 
                src="/hero-meeting.png" 
                alt="Video Meeting" 
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Bottom text */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-12 text-center">
                <p className="text-white font-bold text-lg leading-tight">
                  Noise Reduced. Focus Renewed.<br />Crystal Clear Online Meetings.
                </p>
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 md:px-16 bg-[#f8fafc] dark:bg-[#0F111A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E1A3C] dark:text-white mb-3">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Experience the next generation of online meetings with AI-powered tools designed
              to enhance every conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="light-card p-8">
                <div className="icon-wrap">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1E1A3C] dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 md:px-16 bg-white dark:bg-[#0F111A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E1A3C] dark:text-white mb-3">
              How It Works
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Get started in three simple steps and experience AI-powered meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-gray-200 via-blue-200 to-gray-200 dark:from-white/10 dark:via-blue-500/50 dark:to-white/10" />

            {steps.map((s, i) => (
              <div key={i} className="light-card p-8 text-center relative">
                <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white text-xl font-black
                                flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-200 dark:shadow-blue-500/20 relative z-10">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold text-[#1E1A3C] dark:text-white mb-2">{s.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      <section id="overview" className="py-24 px-6 md:px-16 bg-[#f8fafc] dark:bg-[#0F111A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E1A3C] dark:text-white mb-3">
              Everything You Need in One Platform
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              A complete suite of tools designed to make your meetings more productive and efficient.
            </p>
          </div>

          {/* Tab bar */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-100 dark:border-white/10">
              {overviewTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'text-[#2563EB] dark:text-blue-400 border-b-2 border-[#2563EB] dark:border-blue-400 bg-blue-50/50 dark:bg-blue-500/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'room' && (
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-gray-100 dark:border-white/10"
                     style={{ height: 340 }}>
                  <div className="grid grid-cols-2 h-full gap-3 p-4">
                    {[
                      { name: 'Alex M.', color: '#E91E8C', initials: 'AM', speaking: true },
                      { name: 'Sara K.', color: '#2DBFB8', initials: 'SK', speaking: false },
                      { name: 'James R.', color: '#2563EB', initials: 'JR', speaking: false },
                      { name: 'Maya L.', color: '#F47C2B', initials: 'ML', speaking: false },
                    ].map((p, i) => (
                      <div key={i} className="relative rounded-xl bg-[#1e293b] border border-white/10 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                             style={{ background: p.color + '40', border: `2px solid ${p.color}` }}>
                          {p.initials}
                        </div>
                        <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded">{p.name}</div>
                        {p.speaking && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-pink-500/20 border border-pink-500/30 rounded-full px-2 py-0.5 text-xs text-pink-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                            Speaking
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'transcript' && (
                <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-6 space-y-4" style={{ height: 340 }}>
                  {[
                    { name: 'John Doe', text: "Let's discuss the Q4 roadmap and our priorities for next quarter." },
                    { name: 'Jane Smith', text: "I agree, we should prioritize the AI features and get them shipped." },
                    { name: 'Alex M.', text: "The noise cancellation update is almost ready for testing." },
                  ].map((line, i) => (
                    <div key={i} className="bg-white dark:bg-[#0b0f19] border border-gray-100 dark:border-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
                      <p className="text-sm font-semibold text-[#1E1A3C] dark:text-white mb-1">{line.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{line.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'whiteboard' && (
                <div className="rounded-xl bg-white dark:bg-[#0b0f19] border border-gray-200 dark:border-white/10 flex items-center justify-center" style={{ height: 340 }}>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-[#2563EB] dark:border-blue-500 mx-auto mb-4" />
                    <div className="w-32 h-2 bg-[#2563EB] dark:bg-blue-500 rounded mx-auto mb-2" />
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                  </div>
                </div>
              )}
              {activeTab === 'chat' && (
                <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-6 space-y-3" style={{ height: 340 }}>
                  {[
                    { msg: 'Great presentation! 👏', self: true },
                    { msg: 'Thanks everyone!', self: false },
                    { msg: 'Can we schedule a follow-up?', self: true },
                    { msg: 'Sure, let\'s set it for next Tuesday.', self: false },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.self ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-xl px-4 py-2 text-sm max-w-xs
                        ${m.self
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white dark:bg-[#0b0f19] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}`}>
                        {m.msg}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR AUDIENCE ────────────────────────────────────────────────── */}
      <section id="audience" className="py-24 px-6 md:px-16 bg-white dark:bg-[#0F111A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E1A3C] dark:text-white mb-3">
              Built for Every Team
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Echo Meet adapts to your unique needs, whether you're teaching, collaborating, or presenting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((a, i) => (
              <div key={i} className="light-card p-7 text-center group">
                <div className="text-4xl mb-4">{a.icon}</div>
                <h3 className="text-base font-bold text-[#1E1A3C] dark:text-white mb-2">{a.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#f8fafc] dark:bg-[#0b0f19] border-t border-gray-100 dark:border-white/10 pt-16 pb-8 px-6 transition-colors duration-300 mt-12">
        <div className="max-w-7xl mx-auto">
          {/* Top Section: 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            
            {/* Column 1: Brand & Desc */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden bg-transparent">
                  <img src="/logo.png" alt="Echo Meet" className="w-14 h-14 scale-[1.35] object-contain" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#1E1A3C] dark:text-white">
                  Echo <span className="text-[#2563EB] dark:text-blue-400">Meet</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
                Crystal-clear online meetings powered by AI noise intelligence.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {/* Twitter */}
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                {/* GitHub */}
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                {/* Email */}
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="font-semibold text-[#1E1A3C] dark:text-white mb-5">Product</h4>
              <ul className="space-y-3.5 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Use Cases</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="font-semibold text-[#1E1A3C] dark:text-white mb-5">Company</h4>
              <ul className="space-y-3.5 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Press Kit</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div>
              <h4 className="font-semibold text-[#1E1A3C] dark:text-white mb-5">Resources</h4>
              <ul className="space-y-3.5 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Status</a></li>
              </ul>
            </div>
            
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Echo Meet. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {showModal && (
        <RoomModal onConfirm={handleConfirm} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
