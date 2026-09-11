import { Typography } from '@heroui/react'

interface VideoGridProps {
  isHost?: boolean
  userMode: 'deaf' | 'hearing'
  isVideoOff: boolean
  localVideoRef: React.RefObject<HTMLVideoElement | null>
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  remoteStream: MediaStream | null
  captionText: string
}

export function VideoGrid({
  isHost,
  userMode,
  isVideoOff,
  localVideoRef,
  remoteVideoRef,
  canvasRef,
  remoteStream,
  captionText,
}: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-h-120">
      {/* Local Video Frame */}
      <div className="relative w-full h-95 md:h-full bg-slate-900 brutal-card flex items-center justify-center overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            isVideoOff ? 'hidden' : 'block'
          }`}
        />

        {userMode === 'deaf' && !isVideoOff && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
          />
        )}

        {isVideoOff && (
          <div className="text-white font-bold uppercase tracking-widest text-lg bg-black px-4 py-2 border border-white">
            Camera Off
          </div>
        )}

        <div className="absolute bottom-3 left-3 brutal-badge text-xs px-2 py-1 bg-white">
          You ({isHost ? 'Host' : 'Invitee'})
        </div>
      </div>

      <div className="relative w-full h-95 md:h-full bg-slate-900 brutal-card flex items-center justify-center overflow-hidden">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center brutal-card bg-yellow-200 max-w-xs">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <Typography type="body" className="font-bold text-black uppercase text-sm">
              {isHost ? 'Waiting for participant to enter...' : 'Connecting to host video stream...'}
            </Typography>
          </div>
        )}

        {captionText && (
          <div className="absolute bottom-12 left-4 right-4 brutal-caption">
            {captionText}
          </div>
        )}

        <div className="absolute bottom-3 left-3 brutal-badge text-xs px-2 py-1">
          Participant
        </div>
      </div>
    </div>
  )
}