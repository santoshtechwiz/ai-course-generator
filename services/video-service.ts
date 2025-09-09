import { storageManager } from "@/utils/storage-manager"
import { toast } from "@/components/ui/use-toast"

export interface VideoSettings {
  hasPlayedFreeVideo?: boolean
  autoplay?: boolean
  volume?: number
  theaterMode?: boolean
  miniPlayerPos?: { x: number; y: number }
  freeVideos?: string[]
  [key: string]: any // Allow dynamic keys for course-specific data
}

export interface AuthenticationState {
  hasPlayedFreeVideo: boolean
  canPlayVideo: boolean
  showAuthPrompt: boolean
  isFreeVideo: boolean
}

export class VideoService {
  private static instance: VideoService

  static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService()
    }
    return VideoService.instance
  }

  /**
   * Get authentication state for video access - only allow first video when not authenticated
   */
  getAuthenticationState(
    youtubeVideoId: string,
    isAuthenticated: boolean,
    courseId?: string | number
  ): AuthenticationState {
    if (typeof window === "undefined") {
      return {
        hasPlayedFreeVideo: false,
        canPlayVideo: isAuthenticated,
        showAuthPrompt: false,
        isFreeVideo: false
      }
    }

    // If user is authenticated, allow all videos
    if (isAuthenticated) {
      return {
        hasPlayedFreeVideo: false,
        canPlayVideo: true,
        showAuthPrompt: false,
        isFreeVideo: true
      }
    }

    // For non-authenticated users, only allow the first video
    const videoSettings = storageManager.getVideoSettings()
    const courseKey = `course_${courseId}_first_video`
    const firstVideoId = (videoSettings as any)[courseKey]

    // If this is the first video accessed in this course, allow it
    if (!firstVideoId) {
      // Mark this as the first video for this course
      storageManager.saveVideoSettings({ [courseKey]: youtubeVideoId })
      return {
        hasPlayedFreeVideo: false,
        canPlayVideo: true,
        showAuthPrompt: false,
        isFreeVideo: true
      }
    }

    // Only allow the first video
    const canPlayVideo = firstVideoId === youtubeVideoId

    return {
      hasPlayedFreeVideo: !canPlayVideo,
      canPlayVideo,
      showAuthPrompt: false, // Remove the auth prompt
      isFreeVideo: canPlayVideo
    }
  }

  /**
   * Mark free video as played
   */
  markFreeVideoPlayed(): void {
    try {
      storageManager.saveVideoSettings({ hasPlayedFreeVideo: true })
    } catch (error) {
      console.warn('Failed to save free video state:', error)
    }
  }

  /**
   * Get video settings with defaults
   */
  getVideoSettings(): VideoSettings {
    try {
      return storageManager.getVideoSettings()
    } catch (error) {
      console.warn('Failed to load video settings:', error)
      return {}
    }
  }

  /**
   * Save video settings
   */
  saveVideoSettings(settings: Partial<VideoSettings>): void {
    try {
      storageManager.saveVideoSettings(settings)
    } catch (error) {
      console.warn('Failed to save video settings:', error)
    }
  }

  /**
   * Format time in MM:SS or HH:MM:SS format
   */
  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`
  }

  /**
   * Clamp value between min and max
   */
  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val))
  }

  /**
   * Get video element from container
   */
  getVideoElement(containerRef: React.RefObject<HTMLDivElement | null>): HTMLVideoElement | null {
    if (!containerRef.current) return null

    try {
      // Try to get video from React Player iframe
      const reactPlayerVideo = containerRef.current.querySelector("iframe")?.contentDocument?.querySelector("video")
      if (reactPlayerVideo) {
        return reactPlayerVideo as HTMLVideoElement
      }

      // Fallback to direct video element
      const directVideo = containerRef.current.querySelector("video")
      if (directVideo) {
        return directVideo as HTMLVideoElement
      }

      return null
    } catch (error) {
      console.warn("Error accessing video element:", error)
      return null
    }
  }

  /**
   * Calculate mini player position with constraints
   */
  calculateMiniPlayerPosition(
    savedPosition?: { x: number; y: number },
    width: number = 320,
    height: number = 180
  ): { x: number; y: number } {
    if (typeof window === 'undefined') {
      return { x: 100, y: 100 }
    }

    const w = window.innerWidth
    const h = window.innerHeight
    let initial = { x: w - width - 16, y: h - height - 16 }

    if (savedPosition && typeof savedPosition.x === 'number' && typeof savedPosition.y === 'number') {
      initial = {
        x: this.clamp(savedPosition.x, 8, Math.max(8, w - width - 8)),
        y: this.clamp(savedPosition.y, 8, Math.max(8, h - height - 8)),
      }
    }

    return initial
  }

  /**
   * Handle Picture-in-Picture toggle
   */
  async handlePictureInPictureToggle(
    containerRef: React.RefObject<HTMLDivElement | null>,
    isMiniPlayerActive: boolean,
    isNativePiPActive: boolean,
    onMiniPlayerToggle?: () => void,
    onPiPToggle?: (active: boolean) => void
  ): Promise<void> {
    try {
      const videoEl = this.getVideoElement(containerRef)

      // Check if native PiP is supported
      const isNativePiPSupported = !!(
        videoEl &&
        (videoEl as any).requestPictureInPicture &&
        (document as any).pictureInPictureEnabled
      )

      if (isNativePiPSupported) {
        if (isNativePiPActive) {
          await (document as any).exitPictureInPicture()
        } else {
          // Ensure mini-player is off when entering native PiP
          if (isMiniPlayerActive && onMiniPlayerToggle) {
            onMiniPlayerToggle()
          }

          // Try to get the video element again if not found initially
          let targetVideo: HTMLVideoElement | null = videoEl
          if (!targetVideo) {
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 100))
            targetVideo = this.getVideoElement(containerRef)
          }

          if (!targetVideo) {
            throw new Error('Video element not found')
          }
          await (targetVideo as any).requestPictureInPicture()
        }
        return
      }

      // Fallback to custom mini player
      if (onMiniPlayerToggle) {
        const nextMiniState = !isMiniPlayerActive

        // If turning on mini-player and native PiP is active, exit PiP first
        if (nextMiniState && isNativePiPActive && (document as any).exitPictureInPicture) {
          try {
            await (document as any).exitPictureInPicture()
          } catch (error) {
            console.warn('Failed to exit native PiP:', error)
          }
        }

        onMiniPlayerToggle()
        onPiPToggle?.(nextMiniState)
      } else {
        toast({
          title: "PiP not available",
          description: "This video provider does not support Picture-in-Picture.",
          variant: "destructive",
        })
        onPiPToggle?.(false)
      }
    } catch (error) {
      console.warn('Picture-in-Picture failed:', error)

      // If native PIP fails, try fallback mini player
      if (!isMiniPlayerActive && onMiniPlayerToggle) {
        try {
          onMiniPlayerToggle()
          onPiPToggle?.(true)
          toast({
            title: "Using Mini Player",
            description: "Native PiP not available, using mini player instead.",
          })
        } catch (fallbackError) {
          console.warn('Fallback mini player also failed:', fallbackError)
          toast({
            title: "PiP Error",
            description: "Could not toggle Picture-in-Picture. Please try again.",
            variant: "destructive",
          })
          onPiPToggle?.(false)
        }
      } else {
        toast({
          title: "PiP Error",
          description: "Could not toggle Picture-in-Picture. Please try again.",
          variant: "destructive",
        })
        onPiPToggle?.(false)
      }
    }
  }

  /**
   * Check if video should autoplay
   */
  shouldAutoPlay(
    canPlayVideo: boolean,
    playerReady: boolean,
    autoPlay: boolean,
    autoPlayVideo: boolean,
    isMiniPlayerActive: boolean,
    isNativePiPActive: boolean
  ): boolean {
    return !!(
      canPlayVideo &&
      playerReady &&
      (autoPlay || autoPlayVideo) &&
      !isMiniPlayerActive &&
      !isNativePiPActive
    )
  }

  /**
   * Handle video end logic
   */
  handleVideoEnd(
    onEnded: (() => void) | undefined,
    isAuthenticated: boolean,
    hasPlayedFreeVideo: boolean,
    progressPercentage: number | undefined,
    onNextVideo: (() => void) | undefined,
    autoPlayVideo: boolean,
    setOverlayState: (updater: (prev: any) => any) => void,
    setCountdowns: (updater: (prev: any) => any) => void,
    intervalRefs: React.MutableRefObject<{
      nextNotif: ReturnType<typeof setInterval> | null
      autoPlay: ReturnType<typeof setInterval> | null
      chapterTransition: ReturnType<typeof setInterval> | null
    }>
  ): void {
    onEnded?.()

    // Mark free video as played if not authenticated
    if (!isAuthenticated && !hasPlayedFreeVideo) {
      this.markFreeVideoPlayed()
    }

    const isCourseCompleted = progressPercentage === 100

    if (isCourseCompleted) {
      setOverlayState(prev => ({ ...prev, showChapterEnd: true }))
    } else if (onNextVideo && autoPlayVideo) {
      // Start auto-advance countdown
      setOverlayState(prev => ({ ...prev, showAutoPlayNotification: true }))
      setCountdowns(prev => ({ ...prev, autoPlay: 5 }))

      if (intervalRefs.current.autoPlay) clearInterval(intervalRefs.current.autoPlay)
      intervalRefs.current.autoPlay = setInterval(() => {
        setCountdowns(prev => {
          const newCount = prev.autoPlay - 1
          if (newCount <= 0) {
            if (intervalRefs.current.autoPlay) clearInterval(intervalRefs.current.autoPlay)
            setOverlayState(prevOverlay => ({ ...prevOverlay, showAutoPlayNotification: false }))
            // Use safe deferred caller to avoid setState during render
            this.safeOnNextVideo(onNextVideo)
            return { ...prev, autoPlay: 5 }
          }
          return { ...prev, autoPlay: newCount }
        })
      }, 1000)
    } else {
      setOverlayState(prev => ({ ...prev, showChapterEnd: true }))
    }
  }

  /**
   * Safe deferred call to onNextVideo
   */
  private safeOnNextVideo(onNextVideo: () => void): void {
    setTimeout(() => {
      try {
        onNextVideo()
      } catch (e) {
        console.warn('safeOnNextVideo failed', e)
      }
    }, 0)
  }

  /**
   * Handle play click with authentication checks
   */
  handlePlayClick(
    canPlayVideo: boolean,
    isAuthenticated: boolean,
    hasPlayedFreeVideo: boolean,
    playerReady: boolean,
    onPlayPause: () => void
  ): void {
    if (!canPlayVideo) {
      if (!isAuthenticated) {
        toast({
          title: "Sign in required",
          description: "Please sign in to access all course videos. Only the first video is available for free.",
          variant: "destructive",
        })
        return
      }
    }

    if (!playerReady) {
      toast({
        title: "Video loading",
        description: "Please wait for the video to finish loading.",
      })
      return
    }

    onPlayPause()
  }

  /**
   * Handle theater mode toggle
   */
  handleTheaterModeToggle(
    isTheaterMode: boolean,
    onTheaterModeToggle?: (isTheater: boolean) => void
  ): void {
    const newTheaterMode = !isTheaterMode
    onTheaterModeToggle?.(newTheaterMode)

    try {
      this.saveVideoSettings({ theaterMode: newTheaterMode })
    } catch (error) {
      console.warn('Failed to save theater mode preference:', error)
    }
  }
}

// Export singleton instance
export const videoService = VideoService.getInstance()
