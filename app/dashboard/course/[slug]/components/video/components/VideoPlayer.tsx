"use client"

import React, { useEffect, useMemo, useCallback } from "react";
import ReactPlayer from "react-player/youtube";
import { cn } from "@/lib/tailwindUtils";
import { useVideoPlayer } from "../hooks/useVideoPlayer";
import VideoLoadingOverlay from "./VideoLoadingOverlay";
import VideoErrorState from "./VideoErrorState";
import PlayerControls from "./PlayerControls";
import { VideoPlayerProps } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { TheaterModeManager } from "../Theatre";
import { CourseAILogo } from "../../CourseAILogo";
import VideoErrorBoundary from './VideoErrorBoundary';
import KeyboardShortcutsModal from "../../KeyboardShortcutsModal"; // Import from parent directory

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onEnded,
  onProgress,
  onTimeUpdate,
  rememberPlaybackPosition = true,
  rememberPlaybackSettings = true,
  onBookmark,
  autoPlay = false,
  onVideoLoad,
  onCertificateClick,
  height = "100%",
  width = "100%",
  className = "",
  showControls = true,
  bookmarks = [],
  isAuthenticated = false,
  playerConfig,
  onChapterComplete,
}) => {
  const {
    state,
    playerRef,
    containerRef,
    bufferHealth,
    youtubeUrl,
    handleProgress,
    handlers
  } = useVideoPlayer({
    videoId,
    onEnded,
    onProgress,
    onTimeUpdate,
    rememberPlaybackPosition,
    rememberPlaybackSettings,
    onBookmark,
    autoPlay,
    onVideoLoad,
    onCertificateClick,
  });

  // Memoize YouTube player config to prevent unnecessary re-renders
  const youtubeConfig = useMemo(() => ({
    youtube: {
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        fs: 1,
        controls: 0,
        disablekb: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: typeof window !== "undefined" ? window.location.origin : "",
        cc_load_policy: 0,
      },
    },
  }), [autoPlay]);
  
  const handleOnEnded = useCallback(() => {
    if (typeof onChapterComplete === "function") {
      onChapterComplete();
    }
    if (typeof onEnded === "function") {
      onEnded();
    }
  }, [onEnded, onChapterComplete]);

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const onSeekToBookmark = useCallback((time: number) => {
    handlers.onSeek(time);
  }, [handlers]);

  // Performance monitoring
  useEffect(() => {
    // Measure time to interactive
    const startTime = performance.now();
    
    const markTimeToInteractive = () => {
      if (state.isPlayerReady) {
        const timeToInteractive = performance.now() - startTime;
        
        // Only log in development or send to analytics in production
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[VideoPlayer] Time to interactive: ${timeToInteractive.toFixed(2)}ms`);
        } else if (window.gtag) {
          window.gtag('event', 'performance', {
            event_category: 'video_player',
            event_label: 'time_to_interactive',
            value: Math.round(timeToInteractive),
            video_id: videoId
          });
        }
      }
    };
    
    // Run once when player is ready
    if (state.isPlayerReady) {
      markTimeToInteractive();
    }
  }, [state.isPlayerReady, videoId]);

  return (
    <VideoErrorBoundary>
      <div
        ref={containerRef}
        className={cn(
          "video-player-wrapper relative w-full aspect-video overflow-hidden bg-black rounded-lg",
          className
        )}
        style={{ height, width }}
        onMouseEnter={handlers.handleShowControls}
        onMouseLeave={() => state.playing && handlers.handleShowControls()}
        onClick={handlers.handleShowControls}
      >
        {/* Loading overlay */}
        <VideoLoadingOverlay isVisible={state.isLoading && !state.playerError} />

        {/* Video player */}
        {!state.playerError && (
          <div className="relative w-full h-full">
            <ReactPlayer
              ref={playerRef}
              url={youtubeUrl}
              playing={state.playing}
              volume={state.volume}
              muted={state.muted}
              playbackRate={state.playbackRate}
              width="100%"
              height="100%"
              onPlay={handlers.onPlay}
              onPause={handlers.onPause}
              onEnded={handleOnEnded}
              onReady={handlers.onReady}
              onBuffer={handlers.onBuffer}
              onBufferEnd={handlers.onBufferEnd}
              onError={handlers.onError}
              onProgress={handleProgress}
              config={youtubeConfig}
              style={{ position: "absolute", top: 0, left: 0 }}
              progressInterval={500}
            />
          </div>
        )}

        {/* Error state */}
        {state.playerError && (
          <VideoErrorState
            message={state.playerError.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {/* CourseAI Logo */}
        <CourseAILogo
          show={state.isPlayerReady && !state.playerError && !state.isLoading}
          theaterMode={state.theaterMode}
          showControls={state.showControls}
        />

        {/* Player controls */}
        {showControls && (
          <PlayerControls
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            playbackRate={state.playbackRate}
            played={state.played}
            loaded={state.loaded}
            duration={state.duration}
            isFullscreen={state.isFullscreen}
            isBuffering={state.isBuffering}
            bufferHealth={bufferHealth}
            onPlayPause={handlers.onPlayPause}
            onMute={handlers.onMute}
            onVolumeChange={handlers.onVolumeChange}
            onSeek={handlers.onSeek}
            onPlaybackRateChange={handlers.onPlaybackRateChange}
            onToggleFullscreen={handlers.onToggleFullscreen}
            onAddBookmark={handlers.addBookmark}
            formatTime={formatTime}
            bookmarks={bookmarks}
            onSeekToBookmark={onSeekToBookmark}
            isAuthenticated={isAuthenticated}
            onCertificateClick={onCertificateClick}
            playerConfig={playerConfig}
          />
        )}

        {/* Theater Mode Manager */}
        <TheaterModeManager
          isTheaterMode={state.theaterMode}
          onToggle={handlers.handleTheaterModeToggle}
          onExit={() => {}}
          className="absolute top-4 right-4 z-50"
        />

        {/* Keyboard Shortcuts Modal */}
        {state.showKeyboardShortcuts && (
          <KeyboardShortcutsModal onClose={handlers.handleHideKeyboardShortcuts} show={state.showKeyboardShortcuts} />
        )}
      </div>
    </VideoErrorBoundary>
  );
};

export default VideoPlayer;
