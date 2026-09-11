import { useCallback, useRef, useState, useEffect } from 'react'

const FASTAPI_ENDPOINT = 'https://asl-api-hq7e.onrender.com/predict'
const ASL_DELAY_MS = 3000

export function useAslTranslator(
  userMode: 'deaf' | 'hearing',
  sendCaptionData: (text: string, type: 'asl' | 'speech') => void,
  addToTranscript: (text: string, type: 'asl' | 'speech', isLocal: boolean) => void
) {
  const [localCaption, setLocalCaption] = useState<string>('')
  const lastAslTimestampRef = useRef<number>(0)

  // Clear caption when mode changes
  useEffect(() => {
    if (userMode !== 'deaf') setLocalCaption('')
  }, [userMode])

  const handleFrameLandmarks = useCallback(
    async (landmarks: number[] | null) => {
      if (userMode !== 'deaf') return

      if (!landmarks) {
        setLocalCaption('Translating... (No hand detected)')
        return
      }

      try {
        const response = await fetch(FASTAPI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarks }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.letter && data.confidence > 0.5) {
            const text = `You signed: ${data.letter} (${Math.round(data.confidence * 100)}%)`
            setLocalCaption(text)
            sendCaptionData(text, 'asl')

            const now = Date.now()
            if (now - lastAslTimestampRef.current >= ASL_DELAY_MS) {
              addToTranscript(text, 'asl', true)
              lastAslTimestampRef.current = now
            }
          }
        }
      } catch (err) {
        console.error('[ASL] Prediction error:', err)
      }
    },
    [userMode, sendCaptionData, addToTranscript]
  )

  return { localCaption, setLocalCaption, handleFrameLandmarks }
}