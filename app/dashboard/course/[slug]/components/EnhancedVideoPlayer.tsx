"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Loader2, Bookmark, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { VideoControls } from "./VideoControls"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { 
  setVideoProgress, 
  setAutoplayEnabled, 
  addBookmark,
  setPlaybackSettings,
  setResumePoint,
  setLastPlayedAt
} from "@/store/slices/courseSlice"

interface VideoPlayerProps {
  videoId: string
  onEnded: () => void
  autoPlay?: boolean
  onProgress?: (progress: number) => void
  initialTime?: number
  isLastVideo?: boolean
  onVideoSelect: (videoId: string) => void
  courseName: string
  nextVideoId?: string
  onBookmark?: (time: number) => void
  bookmarks?: number[]
  isAuthenticated?: boolean
  onChapterComplete?: () => void
  playerConfig?: {
    showRelatedVideos?: boolean
    rememberPosition?: boolean
    rememberMute?: boolean
    showCertificateButton?: boolean
  }
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

// Add this fallback component for when the player fails to load
const VideoPlayerFallback = () => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-background rounded-lg border border-border aspect-video">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground mb-4">Unable to load video player</p>
    <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
      Reload Page
    </Button>
  </div>
)

const EnhancedVideoPlayer = ({
  videoId,
  onEnded,
  autoPlay = false,
  onProgress,
  initialTime = 0,
  isLastVideo = false,
  onVideoSelect,
  courseName,
  nextVideoId,
  onBookmark,
  bookmarks = [],
  isAuthenticated = false,
  onChapterComplete,
  playerConfig = {
    showRelatedVideos: false,
    rememberPosition: true,
    rememberMute: true,
    showCertificateButton: false,
  },
}: VideoPlayerProps) => {
  // Get autoplayEnabled state from Redux
  const dispatch = useAppDispatch();
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled);
  const playbackSettings = useAppSelector((state) => state.course.playbackSettings);
  const courseId = useAppSelector((state) => state.course.currentCourseId);
  
  const [playing, setPlaying] = useState(false); // Start as false and enable in onReady
  const [volume, setVolume] = useState(playbackSettings.volume ?? 0.8);
  const [muted, setMuted] = useState(playbackSettings.muted ?? false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(playbackSettings.playbackSpeed ?? 1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false);
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [playerError, setPlayerError] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerLoaded = useRef<boolean>(false);
  const videoIdRef = useRef<string>(videoId);

  // Debug: log autoplay state
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug("[EnhancedVideoPlayer] autoplayEnabled:", autoplayEnabled, "autoPlay:", autoPlay);
  }, [autoplayEnabled, autoPlay]);

  // Update videoIdRef when videoId changes - for comparisons in effects
  useEffect(() => {
    videoIdRef.current = videoId;
  }, [videoId]);

  // Load global player settings from Redux on mount
  useEffect(() => {
    // Apply playback settings from Redux
    setVolume(playbackSettings.volume);
    setMuted(playbackSettings.muted);
    setPlaybackSpeed(playbackSettings.playbackSpeed);
  }, [playbackSettings]);

  // On videoId change, update resume point in Redux
  useEffect(() => {
    // Reset the player loaded flag when video ID changes
    playerLoaded.current = false;
    
    // Debug log
    console.debug("[EnhancedVideoPlayer] videoId changed:", videoId);
    
    // Don't auto-start playing here, wait for onReady
    setPlaying(false);
    setVideoCompleted(false);
    
    // Reset player state for new video
    setPlayed(0);
    setLoaded(0);

    if (courseId) {
      dispatch(setResumePoint({ courseId, resumePoint: 0 }));
      dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }));
    }
  }, [videoId]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }

    if (typeof document !== "undefined") {
      document.addEventListener("fullscreenchange", handleFullscreenChange)
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      if (playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("mousemove", handleMouseMove);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      }
    }
  }, [playing])

  // Check if video is near completion
  useEffect(() => {
    // Change from 0.95 to 0.98 to ensure video plays closer to the end
    if (played > 0.99 && !videoCompleted) {
      setVideoCompleted(true);
      setPlaying(false); // Pause the video when it's completed

      if (onChapterComplete) {
        onChapterComplete();
      }
      setShowCompletionToast(true);

      setTimeout(() => {
        setShowCompletionToast(false);
      }, 3000);
    }
  }, [played, videoCompleted, onChapterComplete])

  // Throttled progress update
  const handleProgress = useCallback(
    (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      if (!playerRef.current?.getInternalPlayer()?.seeking) {
        // Only update state if the change is significant enough
        if (Math.abs(state.played - played) > 0.01) {
          setPlayed(state.played);
        }
        if (Math.abs(state.loaded - loaded) > 0.01) {
          setLoaded(state.loaded);
        }

        if (onProgress && Math.abs(state.played - played) > 0.01) {
          onProgress(state.played);
        }

        // Store progress in Redux instead of localStorage
        if (Math.abs(state.played - lastSavedPosition) > 0.01) {
          dispatch(setVideoProgress({ 
            videoId, 
            time: state.played,
            playedSeconds: state.playedSeconds,
            duration: duration
          }));
          setLastSavedPosition(state.played);
        }
      }

      if (courseId) {
        dispatch(setResumePoint({ courseId, resumePoint: state.played }));
        dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }));
      }
    },
    [onProgress, videoId, lastSavedPosition, played, loaded, dispatch, duration, courseId]
  );

  const handleDuration = (duration: number) => setDuration(duration);

  const handleVideoEnd = () => {
    // Pause the video
    setPlaying(false);

    // Store final position in Redux
    dispatch(setVideoProgress({ 
      videoId, 
      time: 1.0,
      playedSeconds: duration,
      duration: duration 
    }));

    // Always call onEnded when the video actually ends
    onEnded();
  }

  const handleBuffer = () => setIsBuffering(true);
  const handleBufferEnd = () => setIsBuffering(false);

  // Add this useEffect to handle player initialization errors
  useEffect(() => {
    const handlePlayerError = () => {
      console.error("Error initializing video player.");
      setPlayerError(true); // Set error state to show fallback UI
    }

    if (typeof window !== "undefined") {
      window.addEventListener("error", handlePlayerError);
      return () => window.removeEventListener("error", handlePlayerError);
    }
  }, []);

  // Handlers for VideoControls component
  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleSkip = useCallback(
    (seconds: number) => {
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      const newTime = currentTime + seconds;
      const newPosition = Math.max(0, Math.min(newTime / duration, 0.999));
      playerRef.current?.seekTo(newPosition);
      setPlayed(newPosition);

      // Update progress in Redux
      dispatch(setVideoProgress({ 
        videoId, 
        time: newPosition,
        playedSeconds: newTime,
        duration: duration 
      }));
      setLastSavedPosition(newPosition);
    },
    [duration, videoId, dispatch]
  );

  const handleMute = useCallback(() => {
    setMuted((prev) => {
      const newMutedState = !prev;
      // Update Redux state
      dispatch(setPlaybackSettings({
        ...playbackSettings,
        muted: newMutedState
      }));
      return newMutedState;
    });
  }, [dispatch, playbackSettings]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setMuted(newVolume === 0);
    // Update Redux state
    dispatch(setPlaybackSettings({
      ...playbackSettings,
      volume: newVolume,
      muted: newVolume === 0
    }));
  }, [dispatch, playbackSettings]);

  const handleFullscreenToggle = useCallback(() => {
    if (typeof document !== "undefined") {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  }, []);

  const handleNextVideo = useCallback(() => {
    if (nextVideoId) {
      // Save current position in Redux
      dispatch(setVideoProgress({ 
        videoId, 
        time: played,
        playedSeconds: played * duration,
        duration: duration
      }));
      onEnded();
    }
  }, [nextVideoId, onEnded, played, videoId, dispatch, duration]);

  const handleAddBookmark = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      
      // Add bookmark to Redux
      dispatch(addBookmark({
        videoId,
        time: currentTime
      }));
      
      // Call the prop callback if available
      if (onBookmark) {
        onBookmark(currentTime);
      }
      
      setShowBookmarkTooltip(true);

      toast({
        title: "Bookmark Added",
        description: `Bookmark added at ${formatTime(currentTime)}`,
        duration: 3000,
      });

      setTimeout(() => {
        setShowBookmarkTooltip(false);
      }, 2000);
    }
  }, [onBookmark, toast, videoId, dispatch]);

  const handleSeekChange = useCallback(
    (newPlayed: number) => {
      setPlayed(newPlayed);
      playerRef.current?.seekTo(newPlayed);
      
      // Update progress in Redux
      const newPlayedSeconds = newPlayed * duration;
      dispatch(setVideoProgress({ 
        videoId, 
        time: newPlayed,
        playedSeconds: newPlayedSeconds,
        duration: duration 
      }));
      setLastSavedPosition(newPlayed);
      
      // Ensure time display updates immediately on mobile
      if (onProgress) {
        onProgress(newPlayed);
      }

      if (courseId) {
        dispatch(setResumePoint({ courseId, resumePoint: newPlayed }));
        dispatch(setLastPlayedAt({ courseId, lastPlayedAt: new Date().toISOString() }));
      }
    },
    [videoId, onProgress, dispatch, duration, courseId]
  );

  const handlePlaybackSpeedChange = useCallback((newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    // Update Redux state
    dispatch(setPlaybackSettings({
      ...playbackSettings,
      playbackSpeed: newSpeed
    }));
  }, [dispatch, playbackSettings]);

  const handleAutoplayToggle = useCallback(() => {
    // Update autoplay in Redux instead of local state
    dispatch(setAutoplayEnabled(!autoplayEnabled));

    toast({
      title: !autoplayEnabled ? "Autoplay enabled" : "Autoplay disabled",
      description: !autoplayEnabled ? "Videos will play automatically" : "Videos will not play automatically",
      duration: 2000,
    });
  }, [autoplayEnabled, dispatch, toast]);

  const handleSeekToBookmark = useCallback(
    (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time / duration);
        setPlayed(time / duration);

        toast({
          title: "Jumped to Bookmark",
          description: `Playback resumed at ${formatTime(time)}`,
          duration: 2000,
        });
      }
    },
    [duration, toast]
  );

  // Fix: Implement proper onReady handler to ensure video plays
  const handlePlayerReady = useCallback(() => {
    // Mark player as loaded
    playerLoaded.current = true;
    
    console.debug("[EnhancedVideoPlayer] onReady fired - autoPlay:", autoPlay, "autoplayEnabled:", autoplayEnabled);

    // Start playing if autoPlay or autoplayEnabled is true
    if (autoPlay || autoplayEnabled) {
      console.debug("[EnhancedVideoPlayer] Setting playing to true");
      setPlaying(true);
    }

    // If there's an initial time, seek to it
    if (initialTime > 0 && playerRef.current) {
      console.debug("[EnhancedVideoPlayer] Seeking to initialTime:", initialTime);
      playerRef.current.seekTo(initialTime);
    }
  }, [autoPlay, autoplayEnabled, initialTime]);

  // Handle player errors
  const handlePlayerError = useCallback((error: any) => {
    console.error("Video player error:", error);
    setPlayerError(true);
    
    // Try to recover by reloading the player
    if (playerRef.current) {
      try {
        const internalPlayer = playerRef.current.getInternalPlayer();
        if (internalPlayer && internalPlayer.loadVideoById) {
          internalPlayer.loadVideoById(videoId, initialTime);
        }
      } catch (e) {
        console.error("Failed to recover from player error:", e);
      }
    }
  }, [videoId, initialTime]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-background border border-border shadow-sm group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => setShowControls(true)}
    >
      {playerError ? (
        <VideoPlayerFallback />
      ) : (
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onReady={handlePlayerReady}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleVideoEnd}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          onError={handlePlayerError}
          progressInterval={1000}
          playbackRate={playbackSpeed}
          style={{ backgroundColor: "transparent" }}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1, // Set to 1 to enable autoplay via API
                start: Math.floor(initialTime * duration), // Convert from percentage to seconds
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
              },
              onStateChange: (event) => {
                // Track YouTube player state
                console.debug("[EnhancedVideoPlayer] YouTube player state:", event.data);
              },
            },
          }}
        />
      )}

      {/* Bookmark Tooltip */}
      <AnimatePresence>
        {showBookmarkTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50 flex items-center shadow-lg"
          >
            <Bookmark className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Bookmark added!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Toast */}
      <AnimatePresence>
        {showCompletionToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full z-50 flex items-center shadow-lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Chapter completed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Video Controls - Extracted to a separate component */}
      <VideoControls
        show={showControls}
        playing={playing}
        muted={muted}
        volume={volume}
        played={played}
        loaded={loaded}
        duration={duration}
        fullscreen={fullscreen}
        playbackSpeed={playbackSpeed}
        autoplayNext={autoplayEnabled}
        bookmarks={bookmarks}
        nextVideoId={nextVideoId}
        onPlayPause={handlePlayPause}
        onSkip={handleSkip}
        onMute={handleMute}
        onVolumeChange={handleVolumeChange}
        onFullscreenToggle={handleFullscreenToggle}
        onNextVideo={handleNextVideo}
        onSeekChange={handleSeekChange}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        onAutoplayToggle={handleAutoplayToggle}
        onSeekToBookmark={handleSeekToBookmark}
        onAddBookmark={handleAddBookmark}
        formatTime={formatTime}
      />
    </div>
  )
}

export default EnhancedVideoPlayer
