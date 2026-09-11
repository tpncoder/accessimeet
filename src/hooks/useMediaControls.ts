import { useEffect, useRef, useState, useCallback } from 'react'

export function useMediaControls(localStream: MediaStream | null, remoteStream: MediaStream | null) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioMuted(!audioTrack.enabled)
      }
    }
  }, [localStream])

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }, [localStream])

  return {
    localVideoRef,
    remoteVideoRef,
    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
  }
}