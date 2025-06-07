import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";
import { useToast } from "@/hooks/use-toast";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { useAppDispatch, useSelector } from "@/store";
import { addBookmark, removeBookmark } from "@/store/slices/courseSlice";
import type { BookmarkData, VideoMetadata } from "@/app/types/types";

interface VideoPlayerState {
  playing: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
  played: number;
  loaded: number;
  duration: number;
  isFullscreen: boolean;
  showControls: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  playerError: Error | null;
  isPlayerReady: boolean;
  hasStarted: boolean;
  lastPlayedTime: number;
  showKeyboardShortcuts: boolean; // Added this state property
  theaterMode: boolean; // Added this state property
}

interface VideoPlayerOptions {
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
}

export const useVideoPlayer = (options: VideoPlayerOptions) => {
  // Initialize state and refs inside the hook function
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<VideoPlayerState>({
    playing: !!options.autoPlay,
    muted: false,
    volume: 0.8,
    playbackRate: 1.0,
    played: 0,
    loaded: 0,
    duration: 0,
    isFullscreen: false,
    showControls: true,
    isBuffering: false,
    isLoading: true,
    playerError: null,
    isPlayerReady: false,
    hasStarted: false,
    lastPlayedTime: 0,
    showKeyboardShortcuts: false, // Initialize keyboard shortcuts state
    theaterMode: false, // Initialize theater mode state
  });
  
  const [bufferHealth, setBufferHealth] = useState(100);
  const [isPlayerFocused, setIsPlayerFocused] = useState(false);
  
  // Move all other hooks and effects inside this function
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const youtubeUrl = useMemo(() => {
    return `https://www.youtube.com/watch?v=${options.videoId}`;
  }, [options.videoId]);

  // Track if player is focused
  const handlePlayerFocus = useCallback(() => {
    setIsPlayerFocused(true);
  }, []);
  
  const handlePlayerBlur = useCallback(() => {
    setIsPlayerFocused(false);
  }, []);
  
  // Define the missing handlers
  const onPlay = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      playing: true,
      hasStarted: true
    }));
  }, []);

  const onPause = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      playing: false
    }));
  }, []);

  const onPlayPause = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      playing: !prevState.playing,
      hasStarted: true
    }));
  }, []);

  const onVolumeChange = useCallback((volume: number) => {
    setState(prevState => ({
      ...prevState,
      volume,
      muted: volume === 0
    }));
  }, []);

  const onMute = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      muted: !prevState.muted
    }));
  }, []);

  const onSeek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  }, []);

  const onPlaybackRateChange = useCallback((rate: number) => {
    setState(prevState => ({
      ...prevState,
      playbackRate: rate
    }));
  }, []);

  const onToggleFullscreen = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isFullscreen: !prevState.isFullscreen
    }));
  }, []);

  const onReady = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isLoading: false,
      isPlayerReady: true
    }));
  }, []);

  const onBuffer = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isBuffering: true
    }));
  }, []);

  const onBufferEnd = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isBuffering: false
    }));
  }, []);

  const onError = useCallback((error: Error) => {
    setState(prevState => ({
      ...prevState,
      playerError: error,
      isLoading: false
    }));
    console.error("Video player error:", error);
  }, []);

  // Keyboard shortcuts handlers
  const handleShowKeyboardShortcuts = useCallback(() => {
    setState(prevState => ({ ...prevState, showKeyboardShortcuts: true }));
  }, []);
  
  const handleHideKeyboardShortcuts = useCallback(() => {
    setState(prevState => ({ ...prevState, showKeyboardShortcuts: false }));
  }, []);
  
  const handleTheaterModeToggle = useCallback(() => {
    setState(prevState => ({ ...prevState, theaterMode: !prevState.theaterMode }));
  }, []);
  
  const handleShowControls = useCallback(() => {
    setState(prevState => ({ ...prevState, showControls: true }));
  }, []);

  // Bookmark handlers
  const handleAddBookmark = useCallback((time: number, title?: string): void => {
    if (!options.videoId) return;
    
    const bookmarkData: BookmarkData = {
      videoId: options.videoId,
      time,
      title,
      description: title ? `Bookmark at ${time}s: ${title}` : `Bookmark at ${time}s`,
    };
    
    dispatch(addBookmark(bookmarkData));
    
    if (typeof options.onBookmark === 'function') {
      options.onBookmark(time, title);
    }
    
    toast({
      title: "Bookmark added",
      description: "You can access your bookmarks in the timeline or bookmarks panel."
    });
  }, [options.videoId, options.onBookmark, dispatch, toast]);

  const handleRemoveBookmark = useCallback((bookmarkId: string): void => {
    dispatch(removeBookmark({ bookmarkId, videoId: options.videoId }));
    
    toast({
      title: "Bookmark removed",
      description: "The bookmark has been removed."
    });
  }, [options.videoId, dispatch, toast]);

  // Handle progress updates
  const handleProgress = useCallback((progressState: { played: number; loaded: number; playedSeconds: number }): void => {
    setState(prev => ({
      ...prev,
      played: progressState.played,
      loaded: progressState.loaded,
    }));
  
    // Only update buffer health if the value changed significantly (>2%)
    const newBufferHealth = (progressState.loaded - progressState.played) * 100;
    setBufferHealth(prev => Math.abs(prev - newBufferHealth) > 2 ? newBufferHealth : prev);
  
    if (newBufferHealth < 5 && state.playing && state.hasStarted) {
      setState(prev => ({ ...prev, isBuffering: true }));
    } else if (newBufferHealth > 15) {
      setState(prev => ({ ...prev, isBuffering: false }));
    }
  
    options.onProgress?.(progressState);
  }, [state.playing, state.hasStarted, options.onProgress]);

  // All other useEffects and logic
  useEffect(() => {
    // Handle keyboard events only when player is focused
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process keyboard events when:
      // 1. Player is focused
      // 2. Not typing in form elements
      const target = e.target as HTMLElement;
      if (!isPlayerFocused || 
          target?.tagName === "INPUT" || 
          target?.tagName === "TEXTAREA" || 
          target?.isContentEditable) {
        return;
      }
      
      // Rest of keyboard handler logic
      switch (e.key.toLowerCase()) {
        case " ": // Space
          e.preventDefault();
          onPlayPause();
          break;
        case "arrowleft": // Left arrow
          e.preventDefault();
          onSeek(Math.max(0, (playerRef.current?.getCurrentTime() || 0) - 5));
          break;
        case "arrowright": // Right arrow
          e.preventDefault();
          onSeek(Math.min(state.duration, (playerRef.current?.getCurrentTime() || 0) + 5));
          break;
        case "m": // Mute
          e.preventDefault();
          onMute();
          break;
        case "f": // Fullscreen
          e.preventDefault();
          onToggleFullscreen();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          // Seek to percentage of video
          e.preventDefault();
          const percent = parseInt(e.key) * 0.1;
          onSeek(state.duration * percent);
          break;
        case "h": // Show keyboard shortcuts
          e.preventDefault();
          handleShowKeyboardShortcuts();
          break;
        case "t": // Toggle theater mode
          e.preventDefault();
          handleTheaterModeToggle();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isPlayerFocused, state.duration, onPlayPause, onSeek, onMute, onToggleFullscreen, handleShowKeyboardShortcuts, handleTheaterModeToggle]);

  // Add focus/blur event handlers to the player container
  useEffect(() => {
    const playerContainer = containerRef.current;
    
    if (playerContainer) {
      playerContainer.addEventListener("mouseenter", handlePlayerFocus);
      playerContainer.addEventListener("mouseleave", handlePlayerBlur);
      playerContainer.addEventListener("click", handlePlayerFocus);
      playerContainer.addEventListener("focus", handlePlayerFocus);
      
      // Handle clicking outside
      const handleClickOutside = (e: MouseEvent) => {
        if (playerContainer && !playerContainer.contains(e.target as Node)) {
          setIsPlayerFocused(false);
        }
      };
      
      document.addEventListener("click", handleClickOutside);
      
      return () => {
        playerContainer.removeEventListener("mouseenter", handlePlayerFocus);
        playerContainer.removeEventListener("mouseleave", handlePlayerBlur);
        playerContainer.removeEventListener("click", handlePlayerFocus);
        playerContainer.removeEventListener("focus", handlePlayerFocus);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [handlePlayerFocus, handlePlayerBlur]);

  // Add this effect to handle keyboard shortcuts visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleHideKeyboardShortcuts();
      }
    };

    // Only add this listener when shortcuts are shown
    if (state.showKeyboardShortcuts) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.showKeyboardShortcuts, handleHideKeyboardShortcuts]);

  return {
    state,
    playerRef,
    containerRef,
    bufferHealth,
    youtubeUrl,
    handleProgress,
    handlers: {
      onPlay,
      onPause,
      onPlayPause,
      onVolumeChange,
      onMute,
      onSeek,
      onPlaybackRateChange,
      onToggleFullscreen,
      onReady,
      onBuffer,
      onBufferEnd,
      onError,
      addBookmark: handleAddBookmark,
      removeBookmark: handleRemoveBookmark,
      handleShowKeyboardShortcuts, // Add these handlers to the returned object
      handleHideKeyboardShortcuts,
      handleTheaterModeToggle,
      handleShowControls,
    }
  };
};

export default useVideoPlayer;
