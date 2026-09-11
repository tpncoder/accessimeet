import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useCallback, useRef } from 'react'
import { usePeer } from '#/hooks/usePeer'
import { useRoomSession } from '#/hooks/useRoomSession'
import { useGestureOverlay } from '#/hooks/useGestureOverlay'
import { useTranscript } from '#/hooks/useTranscript'
import { RoomHeader } from '#/components/room/RoomHeader'
import { VideoGrid } from '#/components/room/VideoGrid'
import { ControlBar } from '#/components/room/ControlBar'

interface RoomSearchParams {
  isHost?: boolean
}

export const Route = createFileRoute('/room/$room')({
  validateSearch: (search: Record<string, unknown>): RoomSearchParams => ({
    isHost: Boolean(search.isHost),
  }),
  component: RoomComponent,
})

const FASTAPI_ENDPOINT = 'https://asl-api-hq7e.onrender.com/predict'
const ASL_TRANSCRIPT_DELAY_MS = 2000

function RoomComponent() {
  const { room: roomId } = Route.useParams()
  const { isHost } = Route.useSearch()
  const navigate = useNavigate()

  const {
    localId, peer, call, localStream, remoteStream, isConnected,
    sendCaptionData, sendInterrupt, incomingCaption
  } = usePeer(isHost ? roomId : undefined)

  const session = useRoomSession(localStream, remoteStream)
  const { transcript, addToTranscript, exportTranscript } = useTranscript()

  const [hasCalledHost, setHasCalledHost] = useState(false)
  const [localCaption, setLocalCaption] = useState<string>('')
  const [isPredicting, setIsPredicting] = useState<boolean>(false)
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false)
  const [showInterrupt, setShowInterrupt] = useState(false)

  const lastAslTimestampRef = useRef<number>(0)

  useEffect(() => {
    if (session.userMode === 'deaf' && !session.isAudioMuted) {
      session.toggleAudio()
    } else if (session.userMode === 'hearing' && session.isAudioMuted) {
      session.toggleAudio()
    }
  }, [session.userMode])

  useEffect(() => {
    setLocalCaption('')
  }, [session.userMode])

  useEffect(() => {
    if (!isHost && peer && localStream && localId && !hasCalledHost) {
      call(roomId)
      setHasCalledHost(true)
    }
  }, [isHost, peer, localStream, localId, roomId, call, hasCalledHost])

  useEffect(() => {
    if (session.userMode !== 'hearing') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        sendCaptionData(finalTranscript.trim(), 'speech');
        setLocalCaption(`You said: ${finalTranscript}`);
        addToTranscript(finalTranscript.trim(), 'speech', true);
      }
    };

    recognition.onerror = (e: any) => console.error('STT Error:', e.error);
    recognition.onend = () => {
      if (session.userMode === 'hearing') {
        try { recognition.start(); } catch (e) { }
      }
    };

    try { recognition.start(); } catch (e) { }
    return () => { recognition.stop(); };
  }, [session.userMode, sendCaptionData, addToTranscript])

  const handleFrameLandmarks = useCallback(
    async (landmarks: number[] | null) => {
      if (session.userMode !== 'deaf') return

      if (!landmarks) {
        if (!localCaption.startsWith('Remote said:')) {
          setLocalCaption('Translating... (No hand detected)')
        }
        return
      }

      try {
        setIsPredicting(true)
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
            if (now - lastAslTimestampRef.current >= ASL_TRANSCRIPT_DELAY_MS) {
              addToTranscript(text, 'asl', true)
              lastAslTimestampRef.current = now
            }
          }
        }
      } catch (err) {
        console.error('[ASL] Prediction error:', err)
      } finally {
        setIsPredicting(false)
      }
    },
    [session.userMode, sendCaptionData, localCaption, addToTranscript]
  )

  const { canvasRef, isLandmarkerReady, activeTier } = useGestureOverlay({
    localStream,
    localVideoRef: session.localVideoRef,
    userMode: session.userMode,
    isVideoOff: session.isVideoOff,
    onFrameLandmarks: handleFrameLandmarks,
    perfTier: 'auto',
  })

  useEffect(() => {
    if (incomingCaption) {
      if (incomingCaption.type === 'interrupt') {
        setShowInterrupt(true)
        setTimeout(() => setShowInterrupt(false), 5000)
        return
      }

      const age = Date.now() - incomingCaption.timestamp
      if (age < 15000) {
        if (incomingCaption.type === 'speech') {
          addToTranscript(incomingCaption.text, 'speech', false)
        } else if (incomingCaption.type === 'asl') {
          const now = Date.now()
          if (now - lastAslTimestampRef.current >= ASL_TRANSCRIPT_DELAY_MS) {
            const cleanText = incomingCaption.text.replace('You signed: ', '')
            addToTranscript(`Remote signed: ${cleanText}`, 'asl', false)
            lastAslTimestampRef.current = now
          }
        }
      }
    }
  }, [incomingCaption, addToTranscript])

  const getDisplayCaption = () => {
    if (incomingCaption && incomingCaption.type !== 'interrupt') {
      const age = Date.now() - incomingCaption.timestamp
      if (age < 15000) {
        if (incomingCaption.type === 'speech') {
          return `Remote said: ${incomingCaption.text}`
        }
        if (incomingCaption.type === 'asl') {
          const cleanText = incomingCaption.text.replace('You signed: ', '')
          return `Remote signed: ${cleanText}`
        }
      }
    }
    return localCaption || ''
  }

  const displayCaption = getDisplayCaption()

  const handleEndCall = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto font-sans relative min-h-[calc(100vh-2rem)]">

      {showInterrupt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFE66D] border-8 border-black animate-pulse pointer-events-none">
          <div className="text-center p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-5xl md:text-6xl font-black mb-4 text-black">✋ ATTENTION</h1>
            <p className="text-2xl md:text-3xl font-bold text-black">Your partner wants to speak!</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4">
        <RoomHeader
          roomId={roomId}
          isHost={isHost}
          userMode={session.userMode}
          setUserMode={session.setUserMode}
          isConnected={isConnected}
        />

        <div className="relative w-full flex flex-col items-center">
          <VideoGrid
            isHost={isHost}
            userMode={session.userMode}
            isVideoOff={session.isVideoOff}
            localVideoRef={session.localVideoRef}
            remoteVideoRef={session.remoteVideoRef}
            canvasRef={canvasRef}
            remoteStream={remoteStream}
          />

          {!isLandmarkerReady && session.userMode === 'deaf' && (
            <div className="mt-2 text-xs text-gray-500 animate-pulse">
              Loading gesture detection ({activeTier} performance mode)...
            </div>
          )}
        </div>

        <div className="pt-4">
          <ControlBar
            isAudioMuted={session.isAudioMuted}
            isVideoOff={session.isVideoOff}
            onToggleAudio={session.toggleAudio}
            onToggleVideo={session.toggleVideo}
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      <div className="w-full md:w-[400px] flex flex-col gap-4 sticky top-4 self-start">

        {displayCaption && (
          <div className="w-full relative">
            <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm overflow-hidden">
              <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`
                    w-2.5 h-2.5 rounded-full
                    ${displayCaption.includes('signed') ? 'bg-[#00FFCC]' :
                      displayCaption.includes('said') ? 'bg-[#4ECDC4]' : 'bg-[#00FFCC]'}
                    ${!displayCaption.includes('No hand') ? 'animate-pulse' : ''}
                  `} />
                  <span className="font-bold text-xs uppercase tracking-wider">Caption</span>
                </div>
                <span className="text-xs font-mono opacity-90">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="bg-white px-4 py-4">
                <p className={`
                  text-lg md:text-xl font-bold text-center leading-snug
                  ${displayCaption.includes('No hand') || displayCaption.includes('Translating') ? 'text-black' :
                    displayCaption.includes('signed') ? 'text-[#006B6B]' :
                      displayCaption.includes('said') ? 'text-[#2C5F7C]' : 'text-black'}
                `}>
                  {displayCaption}
                </p>
              </div>

              <div className="h-1.5 bg-gradient-to-r from-[#FF6B6B] via-[#FFE66D] to-[#4ECDC4]" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowTranscriptPanel(!showTranscriptPanel)}
              className="flex-1 bg-[#FFE66D] border-4 border-black px-3 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showTranscriptPanel ? 'Hide' : 'Show'} ({transcript.length})
            </button>

            <button
              onClick={exportTranscript}
              disabled={transcript.length === 0}
              className="flex-1 bg-[#4ECDC4] border-4 border-black px-3 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>

          {session.userMode === 'deaf' && (
            <button
              onClick={sendInterrupt}
              className="w-full bg-[#FF6B6B] border-4 border-black px-4 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-white"
            >
              ✋ Raise Hand
            </button>
          )}
        </div>

        {showTranscriptPanel && (
          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm overflow-hidden flex flex-col max-h-[60vh]">
            <div className="bg-black text-white px-4 py-2 flex items-center justify-between shrink-0">
              <span className="font-bold text-xs uppercase tracking-wider">Transcript</span>
              <span className="text-xs font-mono opacity-75">{transcript.length} entries</span>
            </div>
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {transcript.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No transcript entries yet</p>
              ) : (
                transcript.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-2 border-2 border-black rounded-sm ${entry.speaker === 'local' ? 'bg-[#FFE66D]' : 'bg-[#4ECDC4]'
                      }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold">[{entry.formattedTime}]</span>
                      <span className="font-bold text-xs">{entry.speaker === 'local' ? 'You' : 'Remote'}</span>
                      <span className="text-[10px] uppercase opacity-75">({entry.type})</span>
                    </div>
                    <p className="text-xs font-medium leading-snug">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}