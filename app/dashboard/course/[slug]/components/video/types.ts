import type React from "react"

// Base video player types
export interface VideoMetadata {
  title: string
  duration: number
  thumbnail?: string
  description?: string
}

export interface BookmarkData {
  id: string
  videoId: string
  time: number
  title: string
  description?: string
  createdAt: string
}

export interface PlayerConfig {
  showCaptions?: boolean
  showCertificateButton?: boolean
  autoAdvance?: boolean
  rememberPosition?: boolean
}

export interface VideoPlayerState {
  playing: boolean
  muted: boolean
  volume: number
  playbackRate: number
  played: number
  loaded: number
  duration: number
  isFullscreen: boolean
  isBuffering: boolean
  isLoading: boolean
  playerError: Error | null
  isPlayerReady: boolean
  hasStarted: boolean
  lastPlayedTime: number
  showKeyboardShortcuts: boolean
  theaterMode: boolean
  userInteracted: boolean
  autoPlayNext: boolean
  isPictureInPicture: boolean
  isPiPSupported: boolean
  isNearingCompletion: boolean
  isMiniPlayer: boolean
}

export interface ProgressState {
  played: number
  loaded: number
  playedSeconds: number
}

export type CertificateState = "idle" | "downloading" | "success" | "error"

export interface VideoPlayerProps {
  videoId: string
  onEnded?: () => void
  onProgress?: (state: ProgressState) => void
  onTimeUpdate?: (time: number) => void
  rememberPlaybackPosition?: boolean
  rememberPlaybackSettings?: boolean
  onBookmark?: (time: number, title?: string) => void
  autoPlay?: boolean
  onVideoLoad?: (metadata: any) => void
  onCertificateClick?: () => void
  onPlayerReady?: (ref: React.RefObject<any>) => void
  height?: string | number
  width?: string | number
  className?: string
  showControls?: boolean
  bookmarks?: BookmarkData[]
  isAuthenticated?: boolean
  playerConfig?: Record<string, any>
  onChapterComplete?: (chapterId: string) => void
  onNextVideo?: () => void
  nextVideoTitle?: string
  nextVideoId?: string
  chapterTitle?: string
  courseName?: string
  courseId?: string | number
  chapterId?: string
  onPrevVideo?: () => void
  prevVideoTitle?: string
  hasNextVideo?: boolean
  hasPrevVideo?: boolean
  theatreMode?: boolean
  isFullscreen?: boolean
  onTheaterModeToggle?: () => void
  onPictureInPictureToggle?: () => void
}

export interface PlayerControlsProps {
  playing: boolean
  muted: boolean
  volume: number
  playbackRate: number
  played: number
  loaded: number
  duration: number
  isFullscreen: boolean
  isBuffering: boolean
  bufferHealth: number
  onPlayPause: () => void
  onMute: () => void
  onVolumeChange: (volume: number) => void
  onSeekChange: (time: number) => void
  onPlaybackRateChange: (rate: number) => void
  onToggleFullscreen: () => void
  onAddBookmark?: (time: number) => void
  formatTime: (seconds: number) => string
  bookmarks?: number[]
  onSeekToBookmark?: (time: number) => void
  isAuthenticated?: boolean
  onCertificateClick?: () => void

  show?: boolean
  onShowKeyboardShortcuts?: () => void
  onTheaterMode?: () => void
  onNextVideo?: () => void
  onToggleBookmarkPanel?: () => void
  autoPlayNext?: boolean
  onToggleAutoPlayNext?: () => void
  hasNextVideo?: boolean
  nextVideoTitle?: string
  canAccessNextVideo?: boolean
  onPrevVideo?: () => void
  prevVideoTitle?: string
  onIsDragging?: (isDragging: boolean) => void
  onPictureInPicture?: () => void
  onPictureInPictureToggle?: (isPiPActive: boolean) => void
  isPiPSupported?: boolean
  isPiPActive?: boolean
}

export interface ProgressBarProps {
  played: number
  loaded: number
  onSeek: (time: number) => void
  bufferHealth: number
  duration: number
  formatTime: (seconds: number) => string
  bookmarks?: number[]
  onSeekToBookmark?: (time: number) => void
}

export interface BookmarkManagerProps {
  videoId: string
  bookmarks: BookmarkData[]
  currentTime: number
  duration: number
  onSeekToBookmark: (time: number) => void
  onAddBookmark: (time: number, title?: string) => void
  onRemoveBookmark: (bookmarkId: string) => void
  formatTime: (seconds: number) => string
}

export interface BookmarkTimelineProps {
  bookmarks: BookmarkData[]
  duration: number
  currentTime: number
  onSeekToBookmark: (time: number) => void
  formatTime: (seconds: number) => string
}

export interface PlaybackSpeedMenuProps {
  currentSpeed: number
  onSpeedChange: (speed: number) => void
}

export interface TheaterModeManagerProps {
  isTheaterMode: boolean
  onToggle: () => void
  onExit: () => void
  className?: string
}

export interface VideoErrorStateProps {
  onReload: () => void
  onRetry: () => void
  error?: Error
}

export interface VideoLoadingOverlayProps {
  isVisible: boolean
  message?: string
}

// Progress tracking types
export interface ProgressMilestone {
  percentage: number
  reached: boolean
  timestamp?: number
}

export interface CourseProgress {
  courseId: string
  currentChapterId?: string
  completedChapters: string[]
  totalProgress: number
  lastAccessedAt: Date
  milestones: ProgressMilestone[]
}

// Certificate types
export interface CertificateData {
  id: string
  userId: string
  courseId: string
  courseName: string
  completedAt: Date
  certificateUrl?: string
}

// YouTube player specific types
export interface YouTubePlayerConfig {
  youtube: {
    playerVars: {
      autoplay: 0 | 1
      modestbranding: 0 | 1
      rel: 0 | 1
      showinfo: 0 | 1
      iv_load_policy: 1 | 3
      fs: 0 | 1
      controls: 0 | 1
      disablekb: 0 | 1
      playsinline: 0 | 1
      enablejsapi: 0 | 1
      origin: string
      cc_load_policy?: 0 | 1
      preload?: "auto" | "metadata" | "none"
    }
  }
}

// Event handler types
export type VideoEventHandler = () => void
export type ProgressEventHandler = (state: ProgressState) => void
export type TimeUpdateHandler = (time: number) => void
export type BookmarkEventHandler = (time: number, title?: string) => void
export type ErrorEventHandler = (error: Error) => void
export type SeekEventHandler = (time: number) => void
export type VolumeChangeHandler = (volume: number) => void
export type PlaybackRateChangeHandler = (rate: number) => void

// Utility types
export type VideoPlayerMode = "normal" | "theater" | "fullscreen"
export type BufferHealthLevel = "poor" | "fair" | "good" | "excellent"
export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2

// Hook return types
export interface UseVideoPlayerReturn {
  state: VideoPlayerState
  playerRef: React.RefObject<any>
  containerRef: React.RefObject<HTMLDivElement>
  bufferHealth: number
  youtubeUrl: string
  handleProgress: ProgressEventHandler
  handlers: {
    onPlay: VideoEventHandler
    onPause: VideoEventHandler
    onPlayPause: VideoEventHandler
    onVolumeChange: VolumeChangeHandler
    onMute: VideoEventHandler
    onSeek: SeekEventHandler
    onPlaybackRateChange: PlaybackRateChangeHandler
    onToggleFullscreen: VideoEventHandler
    onReady: VideoEventHandler
    onBuffer: VideoEventHandler
    onBufferEnd: VideoEventHandler
    onError: ErrorEventHandler
    addBookmark: BookmarkEventHandler
    removeBookmark: (bookmarkId: string) => void
    handleShowKeyboardShortcuts: VideoEventHandler
    handleHideKeyboardShortcuts: VideoEventHandler
    handleTheaterModeToggle: VideoEventHandler
    handlePictureInPictureToggle: VideoEventHandler
    handleShowControls: VideoEventHandler
    toggleAutoPlayNext: VideoEventHandler
  }
}

// Add types for our new overlay components
export interface ChapterStartOverlayProps {
  visible: boolean
  chapterTitle?: string
  courseTitle?: string
  onComplete?: () => void
  duration?: number
  videoId?: string
}

export interface ChapterEndOverlayProps {
  visible: boolean
  chapterTitle?: string
  nextChapterTitle?: string
  hasNextChapter: boolean
  onNextChapter: () => void
  onReplay: () => void
  onClose?: () => void
  autoAdvanceDelay?: number
  autoAdvance?: boolean
  onCertificateDownload?: () => void
  certificateState?: CertificateState
  isFinalChapter?: boolean
  courseTitle?: string
}
