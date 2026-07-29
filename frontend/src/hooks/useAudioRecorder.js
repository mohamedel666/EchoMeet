import { useRef, useState, useCallback, useEffect } from 'react'

export function useAudioRecorder() {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const isMountedRef = useRef(true)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  // Track mount state so we don't setState after unmount (when called post-navigate)
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      if (isMountedRef.current) setError(null)
      console.log('Starting local audio recording...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      })

      streamRef.current = stream

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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined
      })
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error)
        if (isMountedRef.current) {
          setError(`Recording error: ${event.error}`)
          setIsRecording(false)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      if (isMountedRef.current) setIsRecording(true)
      console.log('Local recording started, MIME type:', selectedMimeType)

    } catch (err) {
      console.error('Error starting recording:', err)
      if (isMountedRef.current) {
        setError(`Failed to start recording: ${err.message}`)
        setIsRecording(false)
      }
    }
  }, [])

  const stopRecording = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recording in progress'))
        return
      }

      // Capture in local vars — remains accessible even after component unmounts
      const mediaRecorder = mediaRecorderRef.current
      const chunks = chunksRef.current

      mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' })
          console.log('Local recording stopped. Blob size:', blob.size)
          // Only update state if still mounted (navigate may have unmounted the component)
          if (isMountedRef.current) setIsRecording(false)
          streamRef.current?.getTracks().forEach(t => t.stop())
          resolve(blob)
        } catch (err) {
          reject(err)
        }
      }

      try {
        mediaRecorder.stop()
      } catch (err) {
        reject(err)
      }
    })
  }, [])

  return { isRecording, error, startRecording, stopRecording }
}
