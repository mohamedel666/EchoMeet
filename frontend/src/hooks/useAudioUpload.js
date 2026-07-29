import { useState, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

export function useAudioUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const uploadAudio = useCallback(async (audioBlob, meetingId, participantName = '') => {
    try {
      setError(null)
      setIsUploading(true)
      setProgress(0)

      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      
      // إضافة meeting_id إلى الطلب
      if (meetingId) {
        formData.append('meeting_id', meetingId)
        console.log('Adding meeting_id to request:', meetingId)
      }
      if (participantName) {
        formData.append('participant_name', participantName)
        console.log('Adding participant_name:', participantName)
      }

      const xhr = new XMLHttpRequest()
      
      // Set timeout for 5 minutes (300 seconds)
      xhr.timeout = 300000

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setProgress(percentComplete)
          console.log(`Upload progress: ${percentComplete}%`)
        }
      })

      // Handle completion
      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          console.log('Upload completed with status:', xhr.status)
          console.log('Response text:', xhr.responseText)
          
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              console.log('Parsed response:', response)
              setIsUploading(false)
              setProgress(100)
              
              // تأكد من أن البيانات موجودة قبل الإرجاع
              if (response.success) {
                resolve(response)
              } else {
                reject(new Error(response.error || 'Analysis failed'))
              }
            } catch (err) {
              console.error('JSON parse error:', err)
              reject(new Error('Invalid response from server'))
            }
          } else {
            console.error('Upload failed with status:', xhr.status)
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          console.error('XHR error event')
          reject(new Error('Upload error'))
        })

        xhr.addEventListener('abort', () => {
          console.error('XHR abort event')
          reject(new Error('Upload aborted'))
        })

        xhr.addEventListener('timeout', () => {
          console.error('XHR timeout event')
          reject(new Error('Upload timeout - server took too long to respond'))
        })

        console.log('Sending audio to:', `${API}/analyze-audio`)
        xhr.open('POST', `${API}/analyze-audio`)
        xhr.send(formData)
      })
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
      setIsUploading(false)
      throw err
    }
  }, [])

  return {
    isUploading,
    error,
    progress,
    uploadAudio
  }
}
