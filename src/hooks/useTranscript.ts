import { useState, useRef, useCallback } from 'react'
import type { TranscriptEntry } from '@/types/TranscriptEntry'

export function useTranscript() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const startTimeRef = useRef<number>(Date.now())

  const addToTranscript = useCallback((text: string, type: 'asl' | 'speech', isLocal: boolean) => {
    const now = Date.now()
    const elapsed = now - startTimeRef.current
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    setTranscript(prev => [...prev, {
      timestamp: now,
      speaker: isLocal ? 'local' : 'remote',
      type,
      text,
      formattedTime
    }])
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript([])
    startTimeRef.current = Date.now()
  }, [])

  const exportTranscript = useCallback(() => {
    const content = transcript.map(entry => 
      `[${entry.formattedTime}] ${entry.speaker === 'local' ? 'You' : 'Remote'} (${entry.type.toUpperCase()}): ${entry.text}`
    ).join('\n\n')

    const header = `ACCESSIMEET TRANSCRIPT\nRoom: ${window.location.pathname.split('/').pop()}\nDate: ${new Date().toLocaleString()}\nDuration: ${transcript.length > 0 ? transcript[transcript.length - 1].formattedTime : '00:00'}\n\n${'='.repeat(60)}\n\n`
    
    const blob = new Blob([header + content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-transcript-${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [transcript])

  const exportAsJSON = useCallback(() => {
    const data = {
      room: window.location.pathname.split('/').pop(),
      date: new Date().toISOString(),
      entries: transcript
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-transcript-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [transcript])

  return { 
    transcript, 
    addToTranscript, 
    clearTranscript, 
    exportTranscript,
    exportAsJSON
  }
}