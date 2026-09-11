import { useUserProfile } from './useUserProfile'
import { useMediaControls } from './useMediaControls'

export function useRoomSession(localStream: MediaStream | null, remoteStream: MediaStream | null) {
  const { userMode, setUserMode } = useUserProfile()
  const {
    localVideoRef,
    remoteVideoRef,
    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
  } = useMediaControls(localStream, remoteStream)

  return {
    localVideoRef,
    remoteVideoRef,
    isAudioMuted,
    isVideoOff,
    userMode,
    setUserMode,
    toggleAudio,
    toggleVideo,
  }
}