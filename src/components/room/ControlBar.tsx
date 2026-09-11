import { Button } from '@heroui/react'

interface ControlBarProps {
  isAudioMuted: boolean
  isVideoOff: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
}

export function ControlBar({ isAudioMuted, isVideoOff, onToggleAudio, onToggleVideo }: ControlBarProps) {
  return (
    <div className="flex items-center gap-4 brutal-card p-3">
      <Button
        onPress={onToggleAudio}
        className={isAudioMuted ? 'brutal-btn-muted' : 'brutal-btn-success'}
      >
        {isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
      </Button>

      <Button
        onPress={onToggleVideo}
        className={isVideoOff ? 'brutal-btn-muted' : 'brutal-btn-success'}
      >
        {isVideoOff ? 'Start Video' : 'Stop Video'}
      </Button>
    </div>
  )
}