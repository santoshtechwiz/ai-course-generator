import VideoPlayer from './components/VideoPlayer';
import VideoLoadingOverlay from './components/VideoLoadingOverlay';
import VideoErrorState from './components/VideoErrorState';
import PlayerControls from './components/PlayerControls';
import BookmarkTimeline from './components/BookmarkTimeline';
import BookmarkManager from './components/BookmarkManager';
import useVideoPlayer from './hooks/useVideoPlayer';
import { TheaterModeManager, useTheaterMode } from './Theatre';
import VideoErrorBoundary from './components/VideoErrorBoundary';
import type {
  VideoPlayerProps,
  PlayerControlsProps,
  ProgressBarProps,
  VideoLoadingOverlayProps,
  VideoErrorStateProps,
  PlaybackSpeedMenuProps,
  BookmarkItem,
  VideoMetadata,
  TheaterModeProps,
  TheaterModeManagerProps,
  KeyboardShortcutsModalProps
} from './types';

export {
  VideoPlayer,
  VideoLoadingOverlay,
  VideoErrorState,
  PlayerControls,
  BookmarkTimeline,
  BookmarkManager,
  useVideoPlayer,
  TheaterModeManager,
  useTheaterMode,
  VideoErrorBoundary
};

export type {
  VideoPlayerProps,
  PlayerControlsProps,
  ProgressBarProps,
  VideoLoadingOverlayProps,
  VideoErrorStateProps,
  PlaybackSpeedMenuProps,
  BookmarkItem,
  VideoMetadata,
  TheaterModeProps,
  TheaterModeManagerProps,
  KeyboardShortcutsModalProps
};
