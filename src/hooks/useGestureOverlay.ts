import { useEffect, useRef, useCallback, useState } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export type PerfTier = 'low' | 'medium' | 'high'

interface UseGestureOverlayOptions {
  localStream: MediaStream | null
  localVideoRef: React.RefObject<HTMLVideoElement | null>
  userMode: 'deaf' | 'hearing'
  isVideoOff: boolean
  onFrameLandmarks?: (landmarks: number[] | null) => void
  perfTier?: PerfTier | 'auto'
}

const TIER_SETTINGS: Record<PerfTier, { targetFps: number; downscaleWidth: number }> = {
  low: { targetFps: 8, downscaleWidth: 256 },
  medium: { targetFps: 15, downscaleWidth: 384 },
  high: { targetFps: 24, downscaleWidth: 640 },
}

function detectPerfTier(): PerfTier {
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as any).deviceMemory as number | undefined
  if (cores <= 4 || (mem !== undefined && mem <= 4)) return 'low'
  if (cores <= 8 || (mem !== undefined && mem <= 8)) return 'medium'
  return 'high'
}

export function useGestureOverlay({
  localStream,
  localVideoRef,
  userMode,
  isVideoOff,
  onFrameLandmarks,
  perfTier = 'auto',
}: UseGestureOverlayOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLandmarkerReady, setIsLandmarkerReady] = useState(false)
  const [activeTier, setActiveTier] = useState<PerfTier>('medium')
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isProcessingRef = useRef(false)
  const lastProcessTimeRef = useRef(0)
  const isTabVisibleRef = useRef(true)
  const downscaleCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const resolvedTier: PerfTier = perfTier === 'auto' ? detectPerfTier() : perfTier
  const settings = TIER_SETTINGS[resolvedTier]

  useEffect(() => {
    setActiveTier(resolvedTier)
  }, [resolvedTier])

  useEffect(() => {
    const handleVisibility = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    let active = true
    async function initLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        let landmarker: HandLandmarker
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
          })
        } catch (gpuErr) {
          console.warn('GPU delegate failed, falling back to CPU:', gpuErr)
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
          })
        }
        if (active) {
          landmarkerRef.current = landmarker
          setIsLandmarkerReady(true)
        } else {
          landmarker.close()
        }
      } catch (err) {
        console.error('Failed to load HandLandmarker:', err)
      }
    }
    initLandmarker()
    return () => {
      active = false
      landmarkerRef.current?.close()
      landmarkerRef.current = null
      setIsLandmarkerReady(false)
    }
  }, [])

  const getDownscaledSource = useCallback(
    (video: HTMLVideoElement): HTMLCanvasElement => {
      if (!downscaleCanvasRef.current) {
        downscaleCanvasRef.current = document.createElement('canvas')
      }
      const dsCanvas = downscaleCanvasRef.current
      const aspect = video.videoHeight / video.videoWidth || 9 / 16
      const targetWidth = settings.downscaleWidth
      const targetHeight = Math.round(targetWidth * aspect)

      if (dsCanvas.width !== targetWidth || dsCanvas.height !== targetHeight) {
        dsCanvas.width = targetWidth
        dsCanvas.height = targetHeight
      }
      const ctx = dsCanvas.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
      }
      return dsCanvas
    },
    [settings.downscaleWidth]
  )

  const processFrame = useCallback(() => {
    const video = localVideoRef.current
    const landmarker = landmarkerRef.current
    const now = performance.now()
    const frameIntervalMs = 1000 / settings.targetFps

    if (
      isTabVisibleRef.current &&
      video &&
      video.readyState >= 2 &&
      landmarker &&
      userMode === 'deaf' &&
      !isVideoOff &&
      !isProcessingRef.current &&
      now - lastProcessTimeRef.current >= frameIntervalMs
    ) {
      isProcessingRef.current = true
      lastProcessTimeRef.current = now
      try {
        const source = getDownscaledSource(video)
        const result = landmarker.detectForVideo(source, now)
        
        let flatLandmarks: number[] | null = null
        const handsDetected = result.landmarks && result.landmarks.length > 0
        
        if (handsDetected && result.landmarks[0]) {
          flatLandmarks = []
          for (let i = 0; i < 21; i++) {
            const lm = result.landmarks[0][i]
            if (lm) {
              flatLandmarks.push(lm.x, lm.y, lm.z)
            } else {
              flatLandmarks.push(0, 0, 0)
            }
          }
        }

        if (onFrameLandmarks) {
          onFrameLandmarks(flatLandmarks)
        }

        const canvas = canvasRef.current
        if (canvas && handsDetected && result.landmarks[0]) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            for (const point of result.landmarks[0]) {
              ctx.beginPath()
              ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI)
              ctx.fillStyle = '#00FFCC'
              ctx.fill()
            }
          }
        }
      } catch (err) {
        console.error('Error during landmark processing:', err)
      } finally {
        isProcessingRef.current = false
      }
    }

    if (userMode === 'deaf' && !isVideoOff) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }
  }, [localVideoRef, userMode, isVideoOff, onFrameLandmarks, settings.targetFps, getDownscaledSource])

  useEffect(() => {
    if (localStream && userMode === 'deaf' && !isVideoOff) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [localStream, userMode, isVideoOff, processFrame])

  return { canvasRef, isLandmarkerReady, activeTier }
}