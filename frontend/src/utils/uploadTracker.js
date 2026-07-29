const API = import.meta.env.VITE_API_URL || '/api';

// Global tracker to persist upload progress and results across page navigations
export const uploadTracker = {
  status: 'idle', // 'idle' | 'recording_stop' | 'uploading' | 'success' | 'error'
  progress: 0,
  result: null,
  error: null,
  listeners: new Set(),
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener({
          status: this.status,
          progress: this.progress,
          result: this.result,
          error: this.error
        });
      } catch (err) {
        console.error('Error in uploadTracker listener:', err);
      }
    });
  },
  
  update(data) {
    Object.assign(this, data);
    this.notify();
  },
  
  reset() {
    this.status = 'idle';
    this.progress = 0;
    this.result = null;
    this.error = null;
    this.notify();
  }
};

export function startBackgroundUpload(audioBlob, meetingId, participantName = '', duration = null) {
  uploadTracker.update({ status: 'uploading', progress: 0, error: null, result: null });
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  if (meetingId) {
    formData.append('meeting_id', meetingId);
  }
  if (participantName) {
    formData.append('participant_name', participantName);
    console.log('Speaker name:', participantName);
  }
  if (duration !== null && duration !== undefined) {
    formData.append('duration', duration);
    console.log('Meeting duration:', duration);
  }
  
  const xhr = new XMLHttpRequest();
  xhr.timeout = 300000; // 5 minutes
  
  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      uploadTracker.update({ progress: percentComplete });
    }
  });
  
  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          uploadTracker.update({ status: 'success', result: response, progress: 100 });
          sessionStorage.setItem('meetingAnalysis', JSON.stringify(response));
        } else {
          uploadTracker.update({ status: 'error', error: response.error || 'Analysis failed' });
        }
      } catch (err) {
        uploadTracker.update({ status: 'error', error: 'Invalid response from server' });
      }
    } else {
      uploadTracker.update({ status: 'error', error: `Upload failed: ${xhr.status}` });
    }
  });
  
  xhr.addEventListener('error', () => {
    uploadTracker.update({ status: 'error', error: 'Upload network error' });
  });
  
  xhr.addEventListener('abort', () => {
    uploadTracker.update({ status: 'error', error: 'Upload aborted' });
  });
  
  xhr.addEventListener('timeout', () => {
    uploadTracker.update({ status: 'error', error: 'Upload timeout - server took too long to respond' });
  });
  
  console.log('[uploadTracker] Sending to /analyze-audio with participantName:', participantName, 'meetingId:', meetingId);
  xhr.open('POST', `${API}/analyze-audio`);
  xhr.send(formData);
}

export function startSequentialBackgroundUpload(localBlob, localStartedAt, remoteBlob, remoteStartedAt, meetingId, localName = '', remoteName = '', duration = null) {
  uploadTracker.update({ status: 'uploading', progress: 0, error: null, result: null });
  
  const uploadOne = (blob, participantName, startedAt, isFinal) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      if (meetingId) formData.append('meeting_id', meetingId);
      if (participantName) formData.append('participant_name', participantName);
      if (startedAt) formData.append('recording_started_at', String(startedAt));
      if (duration !== null && duration !== undefined) formData.append('duration', String(duration));
      
      const xhr = new XMLHttpRequest();
      xhr.timeout = 300000; // 5 minutes
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          const overallProgress = isFinal 
            ? (remoteBlob && remoteBlob.size > 1000 ? 50 + Math.round(percentComplete / 2) : percentComplete)
            : Math.round(percentComplete / 2);
          uploadTracker.update({ progress: overallProgress });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error || 'Analysis failed'));
            }
          } catch (err) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timeout - server took too long to respond')));
      
      xhr.open('POST', `${API}/analyze-audio`);
      xhr.send(formData);
    });
  };

  (async () => {
    try {
      let finalResult = null;
      const hasLocal = localBlob && localBlob.size > 1000;
      const hasRemote = remoteBlob && remoteBlob.size > 1000;
      
      if (hasLocal) {
        console.log('[uploadTracker] Uploading local audio for:', localName);
        finalResult = await uploadOne(localBlob, localName, localStartedAt, !hasRemote);
      }
      
      if (hasRemote) {
        console.log('[uploadTracker] Uploading remote audio for:', remoteName);
        finalResult = await uploadOne(remoteBlob, remoteName, remoteStartedAt, true);
      }
      
      if (finalResult) {
        uploadTracker.update({ status: 'success', result: finalResult, progress: 100 });
        sessionStorage.setItem('meetingAnalysis', JSON.stringify(finalResult));
      } else {
        uploadTracker.update({ status: 'error', error: 'No audio recorded' });
      }
    } catch (err) {
      console.error('[uploadTracker] Sequential upload failed:', err);
      uploadTracker.update({ status: 'error', error: err.message || 'Upload failed' });
    }
  })();
}
