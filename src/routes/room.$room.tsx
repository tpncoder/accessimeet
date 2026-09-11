import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { usePeer } from '#/hooks/usePeer'
import { useRoomSession } from '#/hooks/useRoomSession'
import { useGestureOverlay } from '#/hooks/useGestureOverlay'
import { useTranscript } from '#/hooks/useTranscript'
import { useSpeechToText } from '#/hooks/useSpeechToText'
import { useAslTranslator } from '#/hooks/useAslTranslator'
import { useCaptionManager } from '#/hooks/useCaptionManager'
import { TranscriptPanel, type TranscriptEntry } from '#/components/room/TranscriptPanel'
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
  
  const { localId, peer, call, localStream, remoteStream, isConnected, sendCaptionData, incomingCaption } = usePeer(isHost ? roomId : undefined)
  const session = useRoomSession(localStream, remoteStream)
  const { transcript, addToTranscript, exportTranscript } = useTranscript()
  
  const { localCaption: sttCaption, setLocalCaption: setSttCaption } = useSpeechToText(session.userMode, sendCaptionData, addToTranscript)
  const { localCaption: aslCaption, setLocalCaption: setAslCaption, handleFrameLandmarks } = useAslTranslator(session.userMode, sendCaptionData, addToTranscript)

  const activeLocalCaption = session.userMode === 'hearing' ? sttCaption : aslCaption
  const displayCaption = useCaptionManager(session.userMode, activeLocalCaption, incomingCaption)

  const [hasCalledHost, setHasCalledHost] = useState(false)
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false)

  useEffect(() => {
    if (session.userMode === 'deaf' && !session.isAudioMuted) {
      session.toggleAudio()
    } else if (session.userMode === 'hearing' && session.isAudioMuted) {
      session.toggleAudio()
    }
  }, [session.userMode, session.isAudioMuted, session.toggleAudio])

  useEffect(() => {
    if (!isHost && peer && localStream && localId && !hasCalledHost) {
      call(roomId)
      setHasCalledHost(true)
    }
  }, [isHost, peer, localStream, localId, roomId, call, hasCalledHost])

  const lastRemoteAslRef = useState<number>(0)[0];

  useEffect(() => {
    if (incomingCaption) {
      const age = Date.now() - incomingCaption.timestamp
      if (age < 15000) {
        if (incomingCaption.type === 'speech') {
          addToTranscript(incomingCaption.text, 'speech', false)
        } else if (incomingCaption.type === 'asl') {
          const now = Date.now()
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

        <TranscriptPanel 
          transcript={transcript}
          showPanel={showTranscriptPanel}
          onToggle={() => setShowTranscriptPanel(!showTranscriptPanel)}
          onExport={exportTranscript}
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