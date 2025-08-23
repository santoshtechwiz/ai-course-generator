// Centralized exports for course-related components
export { default as CertificateModal } from './CertificateModal'
export { default as MobilePlaylistOverlay } from './MobilePlaylistOverlay'
export { default as PlaylistSidebar } from './PlaylistSidebar'
export { default as VideoPlayerSection } from './VideoPlayerSection'

// Video components
export { default as VideoPlayer } from './video/components/VideoPlayer'
export { default as PlayerControls } from './video/components/PlayerControls'
export { default as AutoPlayNotification } from './video/components/AutoPlayNotification'
export { default as CompletedVideoOverlay } from './video/components/CompletedVideoOverlay'
export { default as NextChapterAutoOverlay } from './video/components/NextChapterAutoOverlay'
export { default as VideoErrorBoundary } from './video/components/VideoErrorBoundary'

// Utility functions
export { formatDuration, formatMinutes } from './utils/formatUtils'

// Types
export type { BookmarkData, VideoState, VideoProgressData, PlayerConfig } from './video/types'
