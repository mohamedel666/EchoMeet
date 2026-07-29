import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { uploadTracker } from '../utils/uploadTracker'

export default function Summary() {
  const { roomName } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get('meetingId') || searchParams.get('mid')
  const [error, setError] = useState(null)
  
  const [uploadState, setUploadState] = useState(() => ({
    status: uploadTracker.status,
    progress: uploadTracker.progress,
    result: uploadTracker.result,
    error: uploadTracker.error
  }))

  useEffect(() => {
    // 1. Subscribe to background upload updates
    const unsubscribe = uploadTracker.subscribe(state => {
      setUploadState(state)
      if (state.error) {
        setError(state.error)
      }
    })

    // 2. Check if we already have analysis results in sessionStorage
    // IMPORTANT: Only use stored analysis if it belongs to this SAME meeting
    const stored = sessionStorage.getItem('meetingAnalysis')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data && data.success && data.meeting_id && data.meeting_id === meetingId) {
          console.log("Analysis found in session for this meeting, navigating to results...")
          navigate(`/summary/${roomName}/results?meetingId=${meetingId}`)
          return unsubscribe
        } else if (data && data.success && !meetingId) {
          // No meetingId in URL but we have analysis — also navigate
          console.log("Analysis found in session, navigating to results...")
          navigate(`/summary/${roomName}/results?meetingId=${meetingId}`)
          return unsubscribe
        } else {
          console.log("Stored analysis belongs to a different meeting, ignoring stale data.")
        }
      } catch (e) {
        console.error("Error parsing stored analysis", e)
      }
    }

    // 3. If uploadTracker is already done (success) on mount, navigate right away
    if (uploadTracker.status === 'success') {
      navigate(`/summary/${roomName}/results?meetingId=${meetingId}`)
      return unsubscribe
    }

    // 4. Fallback error if upload tracker already failed
    if (uploadTracker.error) {
      setError(uploadTracker.error)
    }

    return () => unsubscribe()
  }, [roomName, navigate, meetingId])

  // Navigate on success
  useEffect(() => {
    if (uploadState.status === 'success') {
      navigate(`/summary/${roomName}/results?meetingId=${meetingId}`)
    }
  }, [uploadState.status, navigate, roomName, meetingId])

  // Get status messages
  const getStatusDetails = () => {
    switch (uploadState.status) {
      case 'recording_stop':
        return {
          title: "Saving Recording",
          description: "Finalizing and preparing your audio recording..."
        }
      case 'uploading':
        return {
          title: "Uploading Conversation",
          description: "Sending your meeting audio to the server for processing..."
        }
      case 'success':
        return {
          title: "Processing AI Summary",
          description: "Our AI is transcribing and summarizing your conversation..."
        }
      case 'error':
        return {
          title: "Processing Failed",
          description: error || "Something went wrong during the analysis."
        }
      default:
        return {
          title: "Waiting for Meeting Data",
          description: "No active upload found. Please go back to Home to start a new meeting."
        }
    }
  }

  const { title, description } = getStatusDetails()

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F111A] text-[#1E1A3C] dark:text-white font-sans flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-[#0b0f19] border-b border-gray-100 dark:border-white/10 py-5 px-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Echo Meet" className="w-12 h-12 object-contain" />
            <span className="font-bold text-xl text-[#1E1A3C] dark:text-white">Echo <span className="text-[#2563EB] dark:text-blue-400">Meet</span></span>
          </Link>
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 font-mono font-bold">
            {roomName}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/20 flex items-center justify-center relative shadow-sm">
            {uploadState.status !== 'error' && uploadState.status !== 'idle' && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            )}
            <svg className={`w-12 h-12 ${uploadState.status === 'error' ? 'text-red-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {uploadState.status === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              )}
            </svg>
          </div>
          
          <h1 className="text-3xl font-black mb-4 text-[#1E1A3C] dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            {description}
          </p>

          {uploadState.status === 'uploading' && (
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2.5 mb-8 overflow-hidden shadow-inner">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadState.progress}%` }}
              ></div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-8 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-150 dark:border-white/5 shadow-sm dark:shadow-none transition-all duration-300">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Audio Upload</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                uploadState.status === 'uploading' ? 'text-blue-500' :
                uploadState.status === 'success' ? 'text-green-500' :
                uploadState.status === 'error' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {uploadState.status === 'uploading' ? `Uploading ${uploadState.progress}%` :
                 uploadState.status === 'success' ? 'Completed' :
                 uploadState.status === 'error' ? 'Failed' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-150 dark:border-white/5 shadow-sm dark:shadow-none transition-all duration-300">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">AI Analysis & Transcription</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                uploadState.status === 'success' ? 'text-purple-500 animate-pulse font-extrabold' :
                uploadState.status === 'error' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {uploadState.status === 'success' ? 'Analyzing...' :
                 uploadState.status === 'error' ? 'Cancelled' : 'Pending'}
              </span>
            </div>
          </div>

          {uploadState.status === 'idle' && (
            <div className="mt-10">
              <Link 
                to="/" 
                className="btn-cta inline-block w-full py-3.5"
              >
                Go back to Home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
