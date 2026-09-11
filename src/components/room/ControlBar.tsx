import { Button } from '@heroui/react'

interface ControlBarProps {
  isAudioMuted: boolean
  isVideoOff: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onEndCall: () => void
}

export function ControlBar({ 
  isAudioMuted, 
  isVideoOff, 
  onToggleAudio, 
  onToggleVideo,
  onEndCall 
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-4 brutal-card p-3 flex-wrap justify-center">
      <Button
        onPress={onToggleAudio}
        className={`${isAudioMuted ? 'brutal-btn-muted' : 'brutal-btn-success'} border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold`}
      >
        {isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
      </Button>

      <Button
        onPress={onToggleVideo}
        className={`${isVideoOff ? 'brutal-btn-muted' : 'brutal-btn-success'} border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold`}
      >
        {isVideoOff ? 'Start Video' : 'Stop Video'}
      </Button>

      <Button
        onPress={onEndCall}
        className="bg-[#FF6B6B] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold flex items-center gap-2"
      >
        End Call
      </Button>
    </div>
  )
}