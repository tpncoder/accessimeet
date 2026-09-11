import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { usePeer } from '#/hooks/usePeer'
import { useRoomSession } from '#/hooks/useRoomSession'
import { useGestureOverlay } from '#/hooks/useGestureOverlay'
import { useTranscript } from '#/hooks/useTranscript'
import { useSpeechToText } from '#/hooks/useSpeechToText'
import { useAslTranslator } from '#/hooks/useAslTranslator'
import { useCaptionManager } from '#/hooks/useCaptionManager'
import { TranscriptPanel } from '#/components/room/TranscriptPanel'
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

function RoomComponent() {
  const { room: roomId } = Route.useParams()
  const { isHost } = Route.useSearch()
  
  const { 
    localId, peer, call, localStream, remoteStream, isConnected, 
    sendCaptionData, sendInterrupt, incomingCaption 
  } = usePeer(isHost ? roomId : undefined)
  
  const session = useRoomSession(localStream, remoteStream)
  const { transcript, addToTranscript, exportTranscript } = useTranscript()
  
  const { localCaption: sttCaption } = useSpeechToText(session.userMode, sendCaptionData, addToTranscript)
  const { localCaption: aslCaption, handleFrameLandmarks } = useAslTranslator(session.userMode, sendCaptionData, addToTranscript)

  const activeLocalCaption = session.userMode === 'hearing' ? sttCaption : aslCaption
  const displayCaption = useCaptionManager(session.userMode, activeLocalCaption, incomingCaption)

  const [hasCalledHost, setHasCalledHost] = useState(false)
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false)
  const [showInterrupt, setShowInterrupt] = useState(false)

  // Auto-Mute Logic
  useEffect(() => {
    if (session.userMode === 'deaf' && !session.isAudioMuted) {
      session.toggleAudio()
    } else if (session.userMode === 'hearing' && session.isAudioMuted) {
      session.toggleAudio()
    }
  }, [session.userMode, session.isAudioMuted, session.toggleAudio])

  // Call remote peer
  useEffect(() => {
    if (!isHost && peer && localStream && localId && !hasCalledHost) {
      call(roomId)
      setHasCalledHost(true)
    }
  }, [isHost, peer, localStream, localId, roomId, call, hasCalledHost])

  // Handle Incoming Data (Captions AND Interrupts)
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
          addToTranscript(`Remote signed: ${incomingCaption.text.replace('You signed: ', '')}`, 'asl', false)
        }
      }
    }
  }, [incomingCaption, addToTranscript])

  const { canvasRef, isLandmarkerReady, activeTier } = useGestureOverlay({
    localStream,
    localVideoRef: session.localVideoRef,
    userMode: session.userMode,
    isVideoOff: session.isVideoOff,
    onFrameLandmarks: handleFrameLandmarks,
    perfTier: 'auto',
  })

  return (
    <div className="p-4 md:p-8 flex flex-col items-center gap-6 w-full max-w-6xl mx-auto font-sans relative">
      
      {/* Interrupt Overlay */}
      {showInterrupt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFE66D] border-8 border-black animate-pulse pointer-events-none">
          <div className="text-center p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-6xl font-black mb-4 text-black">✋ ATTENTION</h1>
            <p className="text-3xl font-bold text-black">Your partner wants to speak!</p>
          </div>
        </div>
      )}

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
          captionText={displayCaption}
        />

        {/* Caption Bar */}
        {displayCaption && (
          <div className="mt-4 w-full max-w-2xl relative">
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
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <div className="bg-white px-6 py-5">
                <p className={`
                  text-xl md:text-2xl font-bold text-center
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

        {/* SINGLE SET OF CONTROLS */}
        <div className="mt-4 flex gap-3 flex-wrap justify-center">
          <button 
            onClick={() => setShowTranscriptPanel(!showTranscriptPanel)}
            className="bg-[#FFE66D] border-4 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {showTranscriptPanel ? 'Hide Transcript' : 'Show Transcript'} ({transcript.length})
          </button>
          
          <button 
            onClick={exportTranscript}
            disabled={transcript.length === 0}
            className="bg-[#4ECDC4] border-4 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            Export TXT
          </button>

          {session.userMode === 'deaf' && (
            <button 
              onClick={sendInterrupt} 
              className="bg-[#FF6B6B] border-4 border-black px-6 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center gap-2 text-white"
            >
              ✋ Raise Hand
            </button>
          )}
        </div>

        {/* Transcript Panel (No buttons inside) */}
        <TranscriptPanel 
          transcript={transcript}
          showPanel={showTranscriptPanel}
        />
        
        {!isLandmarkerReady && session.userMode === 'deaf' && (
          <div className="mt-2 text-xs text-gray-500 animate-pulse">
            Loading gesture detection ({activeTier} performance mode)...
          </div>
        )}
      </div>

      <ControlBar
        isAudioMuted={session.isAudioMuted}
        isVideoOff={session.isVideoOff}
        onToggleAudio={session.toggleAudio}
        onToggleVideo={session.toggleVideo}
      />
    </div>
  )
}