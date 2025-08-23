// VideoPlayer related types

export interface BookmarkData {
  id: string
  videoId: string
  time: number
  title: string
  createdAt: string
  description?: string
}

export interface VideoState {
  currentVideoId: string | null
  currentCourseId: string | number | null
  isPlaying: boolean
  playedSeconds: number
  playedPercentage: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  bookmarks: Record<string, number[]> // videoId -> bookmark times
  // Add setter function types if needed for Zustand store
}

export interface VideoProgressData {
  currentTime: number
  duration: number
  played: number
  loaded: number
  playedSeconds: number
  loadedSeconds: number
}

export interface PlayerConfig {
  showControls: boolean
  autoPlay: boolean
  loop: boolean
  muted: boolean
  playbackRate: number
  pip: boolean
  stopOnUnmount: boolean
  light: boolean
}
