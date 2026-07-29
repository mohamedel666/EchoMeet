import React, { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import AIBadge from '../components/AIBadge'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useAudioUpload } from '../hooks/useAudioUpload'
import { startBackgroundUpload, startSequentialBackgroundUpload, uploadTracker } from '../utils/uploadTracker'

const API = import.meta.env.VITE_API_URL || '/api'

function createDummyStream() {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#0f0c28'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Viewer Only (No Camera)', canvas.width / 2, canvas.height / 2)
  }
  const canvasStream = canvas.captureStream ? canvas.captureStream(1) : (canvas.mozCaptureStream ? canvas.mozCaptureStream(1) : null)
  const videoTrack = canvasStream ? canvasStream.getVideoTracks()[0] : null

  let audioTrack = null
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      const audioCtx = new AudioContext()
      const dest = audioCtx.createMediaStreamDestination()
      audioTrack = dest.stream.getAudioTracks()[0]
    }
  } catch (e) {
    console.warn('Could not create dummy audio track:', e)
  }

  const tracks = []
  if (videoTrack) tracks.push(videoTrack)
  if (audioTrack) tracks.push(audioTrack)
  return new MediaStream(tracks)
}

export default function Meeting() {
  const { roomName } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const meetingId = searchParams.get('meetingId') || searchParams.get('mid')
  
  const [pname, setPname] = useState(() => {
    return searchParams.get('pname') || searchParams.get('name') || localStorage.getItem('pname') || ''
  })
  const [showNameModal, setShowNameModal] = useState(!pname.trim())
  const [tempName, setTempName] = useState('')

  function handleJoinWithName() {
    if (!tempName.trim()) return
    localStorage.setItem('pname', tempName.trim())
    setPname(tempName.trim())
    setShowNameModal(false)
    const params = new URLSearchParams(window.location.search)
    params.set('pname', tempName.trim())
    setSearchParams(params)
  }

  const participantName = pname
  const shareLink = `${window.location.origin}/meeting/${roomName}${meetingId ? `?mid=${meetingId}` : ''}`

  // ── Refs ──────────────────────────────────────────────────────────────────
  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const peerRef        = useRef(null)
  const startRef       = useRef(null)
  const pollIntervalRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  // Remote recording refs
  const remoteRecorderRef = useRef(null)
  const remoteChunksRef = useRef([])
  const localStartedAtRef = useRef(null)
  const remoteStartedAtRef = useRef(null)
  // Capture refs for stopRecording / stopRemoteRecording called after navigate
  const stopRecordingRef = useRef(null)
  const stopRemoteRecordingRef = useRef(null)

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase]       = useState('init')   // init|waiting|connected|error
  const [elapsed, setElapsed]   = useState(0)
  const [micOn, setMicOn]       = useState(true)
  const [camOn, setCamOn]       = useState(true)
  const [copied, setCopied]     = useState(false)
  const [idCopied, setIdCopied] = useState(false)
  const [showInviteCard, setShowInviteCard] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [useDummy, setUseDummy] = useState(false)

  // Lobby & Grid States
  const [isHost, setIsHost] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null) // { call, name }
  const [isWaitingForAdmission, setIsWaitingForAdmission] = useState(false)
  const [remoteParticipantName, setRemoteParticipantName] = useState('')

  // Clear stale session analysis on meeting mount so Summary doesn't show old data
  useEffect(() => {
    sessionStorage.removeItem('meetingAnalysis')
  }, [])

  // Bind local stream to local video element when mounted
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [phase, isWaitingForAdmission, useDummy])

  // Bind remote stream to remote video element when mounted
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
    }
  }, [phase, remoteParticipantName])

  function handleJoinAsViewer() {
    setMicOn(false)
    setCamOn(false)
    setUseDummy(true)
    setPhase('init')
  }
  
  // ── Audio Recording ───────────────────────────────────────────────────────
  const { isRecording, error: recordingError, startRecording, stopRecording } = useAudioRecorder()
  const { isUploading, uploadAudio } = useAudioUpload()

  const startRemoteRecording = (stream) => {
    if (!stream) return
    try {
      console.log('Starting remote audio recording...')
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        console.warn('No remote audio tracks to record')
        return
      }
      
      const remoteStreamOnly = new MediaStream(audioTracks)
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg'
      ]
      let selectedMimeType = ''
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }
      
      const mediaRecorder = new MediaRecorder(remoteStreamOnly, {
        mimeType: selectedMimeType || undefined
      })
      remoteChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) remoteChunksRef.current.push(event.data)
      }
      
      remoteRecorderRef.current = mediaRecorder
      remoteStartedAtRef.current = Date.now()
      mediaRecorder.start()
      console.log('Remote recording started, MIME type:', selectedMimeType)
    } catch (err) {
      console.error('Error starting remote recording:', err)
    }
  }

  const stopRemoteRecording = () => {
    return new Promise((resolve) => {
      if (!remoteRecorderRef.current || remoteRecorderRef.current.state === 'inactive') {
        resolve(null)
        return
      }
      
      remoteRecorderRef.current.onstop = () => {
        const blob = new Blob(remoteChunksRef.current, { type: remoteRecorderRef.current.mimeType || 'audio/webm' })
        console.log('Remote recording stopped. Blob size:', blob.size)
        resolve(blob)
      }
      
      try {
        remoteRecorderRef.current.stop()
      } catch (err) {
        console.error('Error stopping remote recorder:', err)
        resolve(null)
      }
    })
  }

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'connected') return
    if (!startRef.current) startRef.current = Date.now()
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000,
    )
    return () => clearInterval(id)
  }, [phase])

  // ── PeerJS setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pname.trim()) return
    let destroyed = false

    async function init() {
      // 1. Get camera + mic
      let stream
      if (useDummy) {
        stream = createDummyStream()
      } else {
        try {
          // Check if running on HTTPS (required for mobile)
          const isSecureContext = window.isSecureContext || window.location.protocol === 'https:'
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          
          if (!isSecureContext && !isLocalhost) {
            throw new Error('Camera and microphone access require HTTPS. Please use a secure connection.')
          }
          
          // Mobile-friendly constraints
          const constraints = {
            video: {
              facingMode: 'user', // Prefer front camera on mobile
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          }
          
          stream = await navigator.mediaDevices.getUserMedia(constraints)
        } catch (err) {
          if (!destroyed) {
            setPhase('error')
            let errorMessage = 'Could not access camera/mic'
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              errorMessage = 'Camera or microphone access was denied. Please allow access in your browser settings and refresh.'
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              errorMessage = 'No camera or microphone found on this device.'
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
              errorMessage = 'Camera or microphone is already in use by another application.'
            } else if (err.message && err.message.includes('HTTPS')) {
              errorMessage = 'Camera and microphone access require HTTPS. Please use a secure connection.'
            } else {
              errorMessage = `Could not access camera/mic: ${err.message}`
            }
            
            setErrorMsg(errorMessage)
          }
          return
        }
      }
      if (destroyed) { stream.getTracks().forEach(t => t.stop()); return }

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // 2. Create Peer (uses window.Peer from CDN)
      let peer
      try {
        peer = new window.Peer(undefined, {
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          secure: true,
          debug: 0,
        })
      } catch (err) {
        if (!destroyed) {
          setPhase('error')
          setErrorMsg('PeerJS failed to load. Check your internet connection.')
        }
        return
      }
      peerRef.current = peer

      peer.on('error', err => {
        console.warn('[Peer] error:', err.type, err.message)
        if (!destroyed && phase !== 'connected') {
          setPhase('error')
          setErrorMsg(`Connection error: ${err.message}`)
        }
      })

      // 3. Wait for Peer ID
      const myPeerId = await new Promise((resolve, reject) => {
        peer.on('open', resolve)
        peer.on('error', reject)
      }).catch(err => { throw err })
      if (destroyed) return

      // 5. Check if someone else is already in the room
      let existingPeerId = null
      let hostNameFromDb = ''
      try {
        const res = await fetch(`${API}/meetings/peers/${encodeURIComponent(roomName)}`)
        const data = await res.json()
        existingPeerId = data.peer_id
        hostNameFromDb = data.participant_name
      } catch { /* backend might not be up yet, treat as empty room */ }
      if (destroyed) return

      const roomEmpty = !existingPeerId
      setIsHost(roomEmpty)

      // 4. Handle incoming calls (Host listens for incoming calls)
      peer.on('call', call => {
        const callerName = call.options?.metadata?.participantName || "Guest"
        console.log('[Peer] Incoming call from:', callerName)
        setIncomingCall({ call, name: callerName })
      })

      // 6. If someone's there, call them (Guest calls the Host)
      if (existingPeerId && existingPeerId !== myPeerId) {
        setRemoteParticipantName(hostNameFromDb || 'Host')
        setIsWaitingForAdmission(true)
        console.log('[Peer] Calling host:', existingPeerId)
        const call = peer.call(existingPeerId, stream, { metadata: { participantName: pname } })
        if (call) {
          call.on('stream', remoteStream => {
            if (destroyed) return
            remoteStreamRef.current = remoteStream
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
            // Start remote stream recording
            startRemoteRecording(remoteStream)
            setIsWaitingForAdmission(false)
            setPhase('connected')
          })
          call.on('close', () => {
            if (!destroyed) {
              setIsWaitingForAdmission(false)
              setPhase('error')
              setErrorMsg('The host denied your request to join.')
            }
          })
          call.on('error', err => {
            console.warn('[call] error:', err)
            setIsWaitingForAdmission(false)
          })
        }
      }

      // Heartbeat interval for the Host to keep the peer registration fresh in the database
      if (roomEmpty) {
        // 7. Register our peer ID
        try {
          await fetch(`${API}/meetings/peers/${encodeURIComponent(roomName)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peer_id: myPeerId, participant_name: pname }),
          })
        } catch { /* non-fatal */ }

        heartbeatIntervalRef.current = setInterval(async () => {
          try {
            await fetch(`${API}/meetings/peers/${encodeURIComponent(roomName)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ peer_id: myPeerId, participant_name: pname }),
            })
            console.log('[Heartbeat] Host peer registration updated')
          } catch (err) {
            console.warn('[Heartbeat] Failed to update peer registration:', err)
          }
        }, 15000) // Every 15 seconds

        if (!destroyed) setPhase('waiting')
      } else {
        // We are guest, we wait until the host admits us
        if (!destroyed) setPhase('waiting')
      }
    }

    init().catch(err => {
      if (!destroyed) {
        setPhase('error')
        setErrorMsg(err.message || 'Failed to start video call')
      }
    })

    // Cleanup
    return () => {
      destroyed = true
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      try { peerRef.current?.destroy() } catch {}
      fetch(`${API}/meetings/peers/${encodeURIComponent(roomName)}`, { method: 'DELETE' })
        .catch(() => {})
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, pname, useDummy])

  // ── Lobby Actions ─────────────────────────────────────────────────────────
  const handleAdmit = () => {
    if (!incomingCall) return
    const { call, name } = incomingCall
    setRemoteParticipantName(name)
    call.answer(localStreamRef.current)
    call.on('stream', remoteStream => {
      remoteStreamRef.current = remoteStream
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      // Start remote stream recording
      startRemoteRecording(remoteStream)
      setPhase('connected')
    })
    call.on('close', () => {
      setPhase('waiting')
      setRemoteParticipantName('')
    })
    call.on('error', err => console.warn('[call] error:', err))
    setIncomingCall(null)
  }

  const handleDeny = () => {
    if (!incomingCall) return
    incomingCall.call.close()
    setIncomingCall(null)
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleLeave() {
    uploadTracker.reset()
    uploadTracker.update({ status: 'recording_stop' })

    // Navigate FIRST so the user sees the upload progress screen immediately
    // (instead of staring at the dark meeting background while recordings stop)
    navigate(`/summary/${roomName}?meetingId=${meetingId}`)

    // Stop recordings and upload in background after navigation
    try {
      const localBlob = await stopRecording()
      const remoteBlob = await stopRemoteRecording()
      console.log('Stopped local recording. Blob size:', localBlob?.size)
      console.log('Stopped remote recording. Blob size:', remoteBlob?.size)

      if (localBlob && localBlob.size > 1000) {
        startSequentialBackgroundUpload(
          localBlob,
          localStartedAtRef.current,
          remoteBlob,
          remoteStartedAtRef.current,
          meetingId,
          participantName,
          remoteParticipantName || 'Guest',
          elapsed
        )
      } else {
        uploadTracker.update({ status: 'error', error: 'No audio recorded — check mic permissions.' })
      }
    } catch (err) {
      console.error('Error stopping recording:', err)
      uploadTracker.update({ status: 'error', error: 'No audio recorded — check mic permissions.' })
    }
  }
  
  // Start recording when in the room — simple local mic recording
  useEffect(() => {
    if ((phase === 'waiting' || phase === 'connected') && !isRecording) {
      console.log('Starting recording — phase:', phase)
      localStartedAtRef.current = Date.now()
      startRecording().catch(err => console.error('Failed to start recording:', err))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isRecording, startRecording])
  
  function toggleMic() {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(v => !v)
  }

  function toggleCam() {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(v => !v)
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleIdCopy() {
    navigator.clipboard.writeText(roomName).then(() => {
      setIdCopied(true)
      setTimeout(() => setIdCopied(false), 2000)
    }).catch(() => {})
  }

  function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8fafc] dark:bg-[#1E1A3C] text-[#1E1A3C] dark:text-white overflow-hidden transition-colors duration-300">


      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3
                         bg-white/95 dark:bg-[#1E1A3C]/95 border-b border-gray-100 dark:border-white/10 z-30 backdrop-blur-sm transition-colors duration-300">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-[180px]">
          <img src="/logo.png" alt="Echo Meet" className="w-16 h-16 scale-125 object-contain" />
          <span className="font-bold text-sm text-[#1E1A3C] dark:text-white">
            Echo <span className="text-[#E91E8C]">Meet</span>
          </span>
        </div>

        {/* Room + status */}
        <div className="flex items-center gap-3">
          {/* Meeting ID chip with copy tooltip */}
          <div className="relative group">
            <button
              id="meeting-id-chip"
              onClick={handleIdCopy}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10
                         border border-gray-200 dark:border-white/15 rounded-full px-4 py-1.5
                         flex items-center gap-2 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-gray-500 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                     M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-mono font-medium text-gray-800 dark:text-white/90">{roomName}</span>
              {idCopied
                ? <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-3 h-3 text-gray-400 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              }
            </button>
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg
                            bg-gray-900 dark:bg-white text-white dark:text-gray-900
                            text-[11px] font-medium whitespace-nowrap pointer-events-none
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
              {idCopied ? '✓ Copied!' : 'Copy meeting ID'}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-white rotate-45" />
            </div>
          </div>

          {/* Live badge */}
          {(phase === 'waiting' || phase === 'connected') && (
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30
                            rounded-full px-3 py-1 text-xs font-semibold text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Live · {formatTime(elapsed)}
            </div>
          )}
        </div>

        {/* AI Badge + Leave */}
        <div className="min-w-[180px] flex items-center justify-end gap-3">
          <AIBadge />
          <button
            id="leave-meeting-btn"
            onClick={handleLeave}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500
                       text-white text-sm font-semibold px-4 py-2 rounded-xl
                       transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
                   a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave
          </button>
        </div>
      </header>

      {/* ── Main video area ──────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-[#0f0c28] transition-colors duration-300 flex items-center justify-center p-4">

        {/* ── Error state ─────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 px-4"
               style={{
                 background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(233,30,140,0.07) 0%, transparent 70%)'
               }}>

            <div className="relative w-full max-w-sm
                            bg-white dark:bg-[#161B2E]
                            border border-gray-200 dark:border-white/[0.07]
                            rounded-2xl px-7 pt-7 pb-6
                            shadow-xl dark:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]
                            transition-colors duration-300 text-center">

              {/* Subtle top accent line */}
              <div className="absolute top-0 left-8 right-8 h-px
                              bg-gradient-to-r from-transparent via-[#E91E8C]/40 to-transparent
                              dark:via-[#E91E8C]/30 rounded-full" />

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping"
                       style={{ animationDuration: '2.5s' }} />
                  <div className="relative w-12 h-12 rounded-full
                                  bg-red-500/10 dark:bg-red-500/[0.12]
                                  border border-red-400/20 dark:border-red-400/20
                                  flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                           M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z
                           M3 3l18 18" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Title & description */}
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">
                  Camera Access Required
                </h2>
                <p className="text-gray-400 dark:text-white/35 text-[13px] leading-relaxed">
                  {errorMsg || 'Allow camera &amp; microphone access in your browser to join.'}
                </p>
              </div>

              {/* Checklist — blends with card surface in dark mode */}
              <div className="rounded-xl overflow-hidden mb-5
                              border border-gray-100 dark:border-white/[0.05]
                              divide-y divide-gray-100 dark:divide-white/[0.05]">
                {[
                  'Tap the lock/info icon in your browser\'s address bar.',
                  'Select "Allow" for camera and microphone permissions.',
                  'Refresh the page and rejoin the meeting.',
                  'On mobile: Check your browser app settings if permissions are blocked.',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5
                                          bg-gray-50/50 dark:bg-[#1E2640]/60
                                          transition-colors duration-150 text-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full
                                     bg-gradient-to-br from-[#E91E8C] to-[#F47C2B]
                                     flex items-center justify-center shadow-sm flex-none">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[13px] text-gray-600 dark:text-white/55 leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                <button
                  id="error-try-again-btn"
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             font-semibold text-white text-sm
                             bg-gradient-to-r from-[#E91E8C] to-[#F47C2B]
                             hover:opacity-90 active:scale-[0.98] transition-all duration-200
                             shadow-md dark:shadow-[0_4px_20px_rgba(233,30,140,0.25)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>

                <button
                  id="error-viewer-mode-btn"
                  onClick={handleJoinAsViewer}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             font-semibold text-gray-700 dark:text-white/80 text-sm
                             bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10
                             border border-gray-200 dark:border-white/10
                             transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 text-gray-500 dark:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Join without Camera/Mic (Viewer Mode)
                </button>
              </div>

              {/* Footer */}
              <p className="text-center text-[11px] text-gray-400 dark:text-white/20 mt-3">
                Still having trouble?&nbsp;
                <a href="mailto:support@echomeet.app"
                   className="underline underline-offset-2 hover:text-[#E91E8C] transition-colors duration-200">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        )}


        {/* ── Init spinner ────────────────────────────────────────────── */}
        {phase === 'init' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <img src="/logo.png" alt="Echo Meet" className="w-28 h-28 scale-125 object-contain mb-5 animate-pulse" />
            <p className="text-gray-600 dark:text-white/60 text-sm font-medium">Starting camera…</p>
            <div className="flex gap-1.5 mt-4">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#E91E8C] animate-bounce"
                     style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Guest Waiting for Admission screen ──────────────────────── */}
        {isWaitingForAdmission && (
          <div className="absolute inset-0 z-20">
            {/* Full-screen video background */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #1a1535 0%, #2d1b4e 40%, #1a2d4e 100%)' }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!camOn && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a1535 0%, #2d1b4e 40%, #1a2d4e 100%)' }}
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#F47C2B] text-white flex items-center justify-center text-4xl font-bold uppercase shadow-2xl">
                    {pname ? pname[0] : 'U'}
                  </div>
                </div>
              )}
              <div className="absolute bottom-5 left-5 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                {pname} (You)
              </div>
            </div>

            {/* Floating "Asking to join" status card — centered over video */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 backdrop-blur-xl border border-white/15 rounded-2xl px-8 py-6 text-center text-white shadow-2xl max-w-sm w-full mx-4">
                <div className="flex gap-1.5 justify-center mb-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#E91E8C] animate-bounce"
                         style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <h3 className="text-lg font-bold mb-2">Asking to join...</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Please wait, the meeting host (<span className="text-[#2DBFB8] font-semibold">{remoteParticipantName}</span>) will let you in shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Google Meet Dynamic Grid Layout (Waiting & Connected) ─────── */}
        {!isWaitingForAdmission && phase === 'waiting' && (
          <div className="w-full h-full flex items-center justify-center relative p-6">

            {/* ── Small centered video tile ── */}
            <div
              className="relative w-full max-w-xl aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/10"
              style={{ background: 'linear-gradient(135deg, #1a1535 0%, #2d1b4e 40%, #1a2d4e 100%)' }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!camOn && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a1535 0%, #2d1b4e 40%, #1a2d4e 100%)' }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#F47C2B] text-white flex items-center justify-center text-3xl font-bold uppercase shadow-2xl">
                    {pname ? pname[0] : 'U'}
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
                {pname} (You)
              </div>
            </div>

            {/* ── Floating invite card — bottom-left ── */}
            {showInviteCard && (
              <div className="absolute bottom-8 left-8 z-30 w-[290px] bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl p-5 text-start border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Your meeting's ready</p>
                  <button
                    onClick={() => setShowInviteCard(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors cursor-pointer text-xl leading-none select-none"
                    title="Close"
                  >×</button>
                </div>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mb-3 leading-relaxed">
                  Or share this meeting link with others you want in the meeting
                </p>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 mb-3">
                  <p className="text-[12px] text-gray-700 dark:text-white/80 truncate flex-1 font-mono">
                    {shareLink.replace(/^https?:\/\//, '')}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors cursor-pointer"
                    title={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied
                      ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 dark:text-white/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-[11px] text-gray-400 dark:text-white/40 leading-relaxed">
                    People who use this meeting link must get your permission before they can join.
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2">Joined as {pname}</p>
              </div>
            )}
          </div>
        )}

        {!isWaitingForAdmission && phase === 'connected' && (
          <div className="w-full h-full max-w-6xl flex items-center justify-center">
            {/* ── Two participants: Split screen grid ── */}
            <div className="w-full h-full max-h-[85vh] flex flex-col md:flex-row gap-4 items-center justify-center p-2">
              {/* Tile 1: Local Video */}
              <div className="relative flex-1 w-full h-[38vh] md:h-full md:max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 dark:border-white/5 bg-slate-950 transition-all duration-300">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!camOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#F47C2B] text-white flex items-center justify-center text-3xl font-bold uppercase shadow-lg">
                      {pname ? pname[0] : 'U'}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                  {pname} (You)
                </div>
              </div>

              {/* Tile 2: Remote Video */}
              <div className="relative flex-1 w-full h-[38vh] md:h-full md:max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 dark:border-white/5 bg-slate-950 transition-all duration-300">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                  {remoteParticipantName || 'Participant'}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Bottom toolbar (outside video area — no overlap ever) ─────── */}
      <div className="flex-shrink-0 flex items-center justify-center py-3
                      bg-white/95 dark:bg-[#1E1A3C]/95 border-t border-gray-100 dark:border-white/10
                      backdrop-blur-sm transition-colors duration-300">
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                        rounded-2xl px-5 py-2.5 shadow-sm">

          {/* Mic */}
          <button
            id="toolbar-mic-btn"
            onClick={toggleMic}
            title={micOn ? 'Mute microphone' : 'Unmute microphone'}
            className={`flex flex-col items-center gap-1 w-14 py-2 rounded-xl transition-all duration-200 active:scale-95
                        ${micOn
                          ? 'bg-white hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-white shadow-sm'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {micOn ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 00-4 4v4a4 4 0 008 0V7a4 4 0 00-4-4z" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 00-4 4v4a4 4 0 008 0V7a4 4 0 00-4-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </>
              )}
            </svg>
            <span className="text-[10px] font-medium">{micOn ? 'Mic' : 'Muted'}</span>
          </button>

          {/* Camera */}
          <button
            id="toolbar-cam-btn"
            onClick={toggleCam}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
            className={`flex flex-col items-center gap-1 w-14 py-2 rounded-xl transition-all duration-200 active:scale-95
                        ${camOn
                          ? 'bg-white hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-white shadow-sm'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {camOn ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                     M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
                       M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </>
              )}
            </svg>
            <span className="text-[10px] font-medium">{camOn ? 'Camera' : 'Off'}</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />

          {/* Share */}
          <button
            id="toolbar-share-btn"
            onClick={handleCopy}
            title="Copy invite link"
            className="flex flex-col items-center gap-1 w-14 py-2 rounded-xl active:scale-95
                       bg-white hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/20
                       text-gray-800 dark:text-white shadow-sm transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {copied
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342
                       m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316
                       m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684
                       3 3 0 00-5.368-2.684z" />
              }
            </svg>
            <span className="text-[10px] font-medium">{copied ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />

          {/* Leave */}
          <button
            id="toolbar-leave-btn"
            onClick={handleLeave}
            title="Leave meeting"
            className="flex flex-col items-center gap-1 w-14 py-2 rounded-xl active:scale-95
                       bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
                   a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-medium">Leave</span>
          </button>
        </div>
      </div>
      
      {showNameModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="bg-white dark:bg-[#1E1A3C] w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-white/10"
            style={{ animation: 'fadeInScale 0.25s ease-out' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden bg-transparent dark:bg-white">
                <img src="/logo.png" alt="Echo Meet" className="w-14 h-14 scale-[1.35] object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1E1A3C] dark:text-white">Join Meeting</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{roomName}</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Your Name <span className="text-gray-400">(for speaker identification)</span>
            </label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && tempName.trim() && handleJoinWithName()}
              placeholder="e.g. Mohamed"
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[#1E1A3C] dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#2563EB] dark:focus:border-blue-500
                         focus:ring-2 focus:ring-[#2563EB]/20 transition-all duration-200 mb-1"
              autoFocus
            />
            {!tempName.trim() && (
              <p className="text-xs text-red-500 mb-4 font-semibold">Name is required to join the meeting.</p>
            )}

            <button
              onClick={handleJoinWithName}
              disabled={!tempName.trim()}
              className="w-full btn-cta py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Join Meeting
            </button>
          </div>
        </div>
      )}

      {/* ── Admit/Deny Lobby Modal ────────────────────────────────────── */}
      {incomingCall && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="bg-white dark:bg-[#1E1A3C] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-white/10 text-center"
            style={{ animation: 'fadeInScale 0.25s ease-out' }}
          >
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E91E8C] to-[#F47C2B] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-md uppercase">
              {incomingCall.name ? incomingCall.name[0] : 'G'}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Someone wants to join
            </h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-6">
              <span className="font-semibold text-gray-800 dark:text-white">{incomingCall.name}</span> is asking to join this meeting.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeny}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white/80 font-semibold text-sm transition-colors cursor-pointer"
              >
                Deny
              </button>
              <button
                onClick={handleAdmit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#F47C2B] hover:opacity-95 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                Admit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
