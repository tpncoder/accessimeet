import { useEffect, useRef, useState } from 'react'

export function useRemoteSpeechToText(remoteStream: MediaStream | null) {
  const [transcript, setTranscript] = useState<string>('')
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null)

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
      } else if (interimTranscript) {
        setTranscript(prev => {
          const lastSentence = prev.split('.').pop() || ''
          return prev.replace(lastSentence, '') + interimTranscript
        })
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  useEffect(() => {
    if (!remoteStream || !recognitionRef.current) return

    if (sourceRef.current) sourceRef.current.disconnect()
    if (audioContextRef.current) audioContextRef.current.close()

    const audioTracks = remoteStream.getAudioTracks()
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in remote stream')
      return
    }

    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(remoteStream)
    
    audioContextRef.current = audioCtx
    sourceRef.current = source

    try {
      recognitionRef.current.start()
    } catch (e) {
    }

    return () => {
      recognitionRef.current?.stop()
      source.disconnect()
      audioCtx.close()
    }
  }, [remoteStream])

  const clearTranscript = () => setTranscript('')

  return { transcript, clearTranscript }
}