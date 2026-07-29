import React, { useEffect, useState } from 'react'

// Cycles through AI states to simulate real activity
const STATES = ['listening', 'processing', 'speaking']

const STATE_CONFIG = {
  listening: {
    label: 'AI Listening',
    dotColor: 'bg-[#2DBFB8]',
    textColor: 'text-[#2DBFB8]',
    borderColor: 'border-[#2DBFB8]/30',
    glow: '0 0 12px rgba(45,191,184,0.35)',
    ping: true,
  },
  processing: {
    label: 'AI Processing',
    dotColor: 'bg-[#E91E8C]',
    textColor: 'text-[#E91E8C]',
    borderColor: 'border-[#E91E8C]/30',
    glow: '0 0 12px rgba(233,30,140,0.35)',
    ping: false,
  },
  speaking: {
    label: 'AI Speaking',
    dotColor: 'bg-[#F47C2B]',
    textColor: 'text-[#F47C2B]',
    borderColor: 'border-[#F47C2B]/30',
    glow: '0 0 12px rgba(244,124,43,0.35)',
    ping: true,
  },
}

export default function AIBadge({ state: externalState }) {
  const [internalState, setInternalState] = useState('listening')
  const activeState = externalState || internalState
  const config = STATE_CONFIG[activeState] || STATE_CONFIG.listening

  // Demo cycle if no external state is provided
  useEffect(() => {
    if (externalState) return
    let idx = 0
    const DURATIONS = [4000, 2000, 3000]
    let timer

    function cycle() {
      idx = (idx + 1) % STATES.length
      setInternalState(STATES[idx])
      timer = setTimeout(cycle, DURATIONS[idx])
    }
    timer = setTimeout(cycle, DURATIONS[0])
    return () => clearTimeout(timer)
  }, [externalState])

  return (
    <div
      id="ai-badge"
      className={`flex items-center gap-2 bg-white/90 dark:bg-[#0F172A]/90 border ${config.borderColor}
                 backdrop-blur-md rounded-full px-4 py-2 shadow-lg transition-all duration-500`}
      style={{ boxShadow: config.glow }}
    >
      {/* Status dot */}
      <span className="relative flex h-2.5 w-2.5">
        {config.ping && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dotColor}`} />
      </span>

      {/* Label */}
      <span className={`text-xs font-semibold ${config.textColor} tracking-wide whitespace-nowrap transition-colors duration-300`}>
        {config.label}
      </span>

      {/* Waveform bars (only when speaking/processing) */}
      {(activeState === 'speaking' || activeState === 'processing') && (
        <span className="flex items-end gap-[2px] h-3">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`w-[2px] rounded-full ${config.dotColor} opacity-80`}
              style={{
                height: activeState === 'speaking' ? '100%' : '50%',
                animation: `aiBar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </span>
      )}

      <style>{`
        @keyframes aiBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
