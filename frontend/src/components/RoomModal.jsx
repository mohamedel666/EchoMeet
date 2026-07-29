import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

const ADJECTIVES = ['Swift', 'Bright', 'Bold', 'Vivid', 'Clear', 'Sharp', 'Keen', 'Calm', 'Agile', 'Solid']
const NOUNS = ['Falcon', 'Eagle', 'Summit', 'Harbor', 'Nexus', 'Vertex', 'Prism', 'Pulse', 'Orbit', 'Crest']

function generateRoomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${adj}${noun}${digits}`
}

export default function RoomModal({ onConfirm, onClose }) {
  const [roomName, setRoomName] = useState(generateRoomName)
  const [participantName, setParticipantName] = useState(() => localStorage.getItem('pname') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleStart() {
    if (!roomName.trim() || !participantName.trim()) {
      setError('Please enter your name to join the meeting.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName.trim() }),
      })
      if (!res.ok) {
        let errorMessage = `Failed to create meeting (${res.status})`
        try {
          const err = await res.json()
          errorMessage = err.detail || errorMessage
        } catch {
          // Response body was empty or not valid JSON
        }
        throw new Error(errorMessage)
      }
      const data = await res.json()
      localStorage.setItem('pname', participantName.trim())
      onConfirm({ ...data, participantName: participantName.trim() })
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot reach the server. Please make sure the backend is running on port 8002.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleStart()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-[#1E1A3C] w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-white/10"
        style={{ animation: 'fadeInScale 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden bg-transparent dark:bg-white">
              <img src="/logo.png" alt="Echo Meet" className="w-14 h-14 scale-[1.35] object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E1A3C] dark:text-white">New Meeting</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Echo Meet</p>
            </div>
          </div>
          <button
            id="modal-close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white text-2xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            ×
          </button>
        </div>

        {/* Participant Name */}
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Your Name <span className="text-gray-400">(for speaker identification)</span>
        </label>
        <input
          type="text"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Mohamed"
          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1E1A3C] dark:text-white
                     placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#2563EB] dark:focus:border-blue-500
                     focus:ring-2 focus:ring-[#2563EB]/20 transition-all duration-200 mb-1"
        />
        {!participantName.trim() && (
          <p className="text-xs text-red-500 mb-4 font-semibold">Name is required to launch or join.</p>
        )}

        {/* Room name */}
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Room Name
        </label>
        <input
          id="room-name-input"
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1E1A3C] dark:text-white
                     placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#2563EB] dark:focus:border-blue-500
                     focus:ring-2 focus:ring-[#2563EB]/20 transition-all duration-200 mb-2 font-mono text-sm"
          autoFocus
        />
        <button
          onClick={() => setRoomName(generateRoomName())}
          className="text-xs text-[#2563EB] dark:text-blue-400 hover:text-[#1d4ed8] dark:hover:text-blue-300 transition-colors mb-5"
        >
          ↺ Generate new name
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3 mb-6">
          <svg className="w-4 h-4 text-[#2563EB] dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd" />
          </svg>
          <p className="text-xs text-[#2563EB] dark:text-blue-400">AI will automatically transcribe and summarize your meeting.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button id="modal-cancel" onClick={onClose} className="btn-outline flex-1 py-3">
            Cancel
          </button>
          <button
            id="modal-confirm"
            onClick={handleStart}
            disabled={loading || !roomName.trim() || !participantName.trim()}
            className="btn-cta flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Launch Meeting
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
