import { useEffect, useState } from 'react'

export function useSpeechToText(
  userMode: 'deaf' | 'hearing',
  sendCaptionData: (text: string, type: 'asl' | 'speech') => void,
  addToTranscript: (text: string, type: 'asl' | 'speech', isLocal: boolean) => void
) {
  const [localCaption, setLocalCaption] = useState<string>('')

  useEffect(() => {
    if (userMode !== 'hearing') {
      setLocalCaption('')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
      }
      if (finalTranscript) {
        const text = finalTranscript.trim()
        sendCaptionData(text, 'speech')
        setLocalCaption(`You said: ${text}`)
        addToTranscript(text, 'speech', true)
      }
    }

    recognition.onerror = (e: any) => console.error('STT Error:', e.error)
    
    recognition.onend = () => {
      if (userMode === 'hearing') {
        try { recognition.start() } catch (e) {}
      }
    }

    try { recognition.start() } catch (e) {}
    return () => { recognition.stop() }
  }, [userMode, sendCaptionData, addToTranscript])

  return { localCaption, setLocalCaption }
}