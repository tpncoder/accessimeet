import { useMemo } from 'react'

interface IncomingCaption {
  text: string
  type: 'asl' | 'speech'
  timestamp: number
}

export function useCaptionManager(
  userMode: 'deaf' | 'hearing',
  localCaption: string,
  incomingCaption: IncomingCaption | null
) {
  return useMemo(() => {
    // Priority 1: Incoming Remote Captions
    if (incomingCaption) {
      const age = Date.now() - incomingCaption.timestamp
      if (age < 15000) { // Show for 15s
        if (incomingCaption.type === 'speech') {
          return `Remote said: ${incomingCaption.text}`
        }
        if (incomingCaption.type === 'asl') {
          const cleanText = incomingCaption.text.replace('You signed: ', '')
          return `Remote signed: ${cleanText}`
        }
      }
    }

    // Priority 2: Local Captions
    return localCaption || ''
  }, [userMode, localCaption, incomingCaption])
}