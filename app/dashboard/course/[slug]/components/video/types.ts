import { ReactNode } from "react";
import type { BookmarkItem } from "@/store/slices/courseSlice";

// Video metadata type
export interface VideoMetadata {
  id: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
}

// YouTube player config type
export interface YouTubePlayerConfig {
  youtube: {
    playerVars: {
      autoplay: 0 | 1;
      modestbranding: 0 | 1;
      rel: 0 | 1;
      showinfo: 0 | 1;
      iv_load_policy: 1 | 3;
      fs: 0 | 1;
      controls: 0 | 1 | 2;
      disablekb: 0 | 1;
      playsinline: 0 | 1;
      enablejsapi: 0 | 1;
      origin: string;
      cc_load_policy: 0 | 1;
      start?: number;
      end?: number;
    };
  };
}

// Video player configuration
export interface VideoPlayerConfig {
  showRelatedVideos?: boolean;
  rememberPosition?: boolean;
  rememberMute?: boolean;
  showCertificateButton?: boolean;
  disablePlaylist?: boolean;
  allowAnnotations?: boolean;
}

// Video player props
export interface VideoPlayerProps {
  videoId: string;
  onEnded?: () => void;
  onProgress?: (state: { played: number; loaded: number; playedSeconds: number }) => void;
  onTimeUpdate?: (time: number) => void;
  rememberPlaybackPosition?: boolean;
  rememberPlaybackSettings?: boolean;
  onBookmark?: (time: number, title?: string) => void;
  autoPlay?: boolean;
  onVideoLoad?: (metadata: VideoMetadata) => void;
  onCertificateClick?: () => void;
  height?: string | number;
  width?: string | number;
  className?: string;
  showControls?: boolean;
  bookmarks?: number[];
  isAuthenticated?: boolean;
  playerConfig?: VideoPlayerConfig;
  onChapterComplete?: () => void;
  courseCompleted?: boolean;
  isMobile?: boolean;
}

// Player controls props
export interface PlayerControlsProps {
  playing: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
  played: number;
  loaded: number;
  duration: number;
  isFullscreen: boolean;
  isBuffering: boolean;
  bufferHealth: number;
  onPlayPause: () => void;
  onMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onAddBookmark: (time: number, title?: string) => void;
  formatTime: (seconds: number) => string;
  bookmarks: number[];
  onSeekToBookmark: (time: number) => void;
  isAuthenticated: boolean;
  onCertificateClick?: () => void;
  playerConfig?: VideoPlayerConfig;
}

// Progress bar props
export interface ProgressBarProps {
  played: number;
  loaded: number;
  onSeek: (time: number) => void;
  bufferHealth: number;
  duration: number;
  formatTime: (seconds: number) => string;
  bookmarks?: number[];
  onSeekToBookmark?: (time: number) => void;
}

// Loading overlay props
export interface VideoLoadingOverlayProps {
  isVisible: boolean;
}

// Error state props
export interface VideoErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

// Playback speed menu props
export interface PlaybackSpeedMenuProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

// Bookmark manager props
export interface BookmarkManagerProps {
  videoId: string;
  bookmarks: BookmarkItem[];
  currentTime: number;
  duration: number;
  onSeekToBookmark: (time: number) => void;
  onAddBookmark: (time: number, title?: string) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  formatTime: (seconds: number) => string;
}

// Theatre mode props
export interface TheaterModeProps {
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export interface TheaterModeManagerProps {
  isTheaterMode: boolean;
  onToggle: () => void;
  onExit: () => void;
  className?: string;
}

// Keyboard shortcuts modal props
export interface KeyboardShortcutsModalProps {
  onClose: () => void;
  show: boolean;
}

// Constants
export const CONTROLS_HIDE_DELAY = 3000;
export const OVERLAY_TIMEOUT = 3000;

// Add more comprehensive types
export interface VideoProgressEvent {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}
