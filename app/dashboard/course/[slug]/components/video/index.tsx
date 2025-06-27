import VideoPlayer from './components/VideoPlayer';
import VideoLoadingOverlay from './components/VideoLoadingOverlay';
import VideoErrorState from './components/VideoErrorState';
import PlayerControls from './components/PlayerControls';
import BookmarkTimeline from './components/BookmarkTimeline';
import { TheaterModeManager } from './Theatre';
import { useVideoPlayer } from './hooks/useVideoPlayer';

import type {
  VideoPlayerProps,
  PlayerControlsProps,
  ProgressBarProps,
  VideoLoadingOverlayProps,
  VideoErrorStateProps,
  PlaybackSpeedMenuProps,
  VideoMetadata,
  TheaterModeManagerProps,
} from './types';

export {
  VideoPlayer,
  VideoLoadingOverlay,
  VideoErrorState,
  PlayerControls,
  BookmarkTimeline,
  TheaterModeManager,
  useVideoPlayer,
};

export type {
  VideoPlayerProps,
  PlayerControlsProps,
  ProgressBarProps,
  VideoLoadingOverlayProps,
  VideoErrorStateProps,
  PlaybackSpeedMenuProps,
  VideoMetadata,
  TheaterModeManagerProps,
};
