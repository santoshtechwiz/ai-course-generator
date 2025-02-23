"use client";

import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Settings, Rewind, FastForward, SkipBack, SkipForward, Square, MonitorPlay } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useHotkeys } from "react-hotkeys-hook";
import VideoPlayerProvider, { VideoPlayerContext } from "./VideoPlayerContext";

interface VideoPlayerProps {
  videoId: string;
  nextVideoId?: string;
  onVideoEnd?: () => void;
  onTimeUpdate?: (time: number) => void;
  initialTime?: number;
  theme?: 'light' | 'dark';
  skipSeconds?: number;
}

const VideoPlayerInner: React.FC<VideoPlayerProps> = ({
  videoId,
  nextVideoId,
  onVideoEnd,
  onTimeUpdate,
  initialTime = 0,
  theme = 'dark',
  skipSeconds = 10,
}) => {
  const {
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    duration,
    setDuration,
    quality,
    setQuality,
    currentQuality,
    setCurrentQuality,
    progress,
    setProgress,
  } = useContext(VideoPlayerContext);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Added state for settings menu

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoIdRef = useRef(videoId);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    videoIdRef.current = videoId;
  }, [videoId]);

  useEffect(() => {
    if (isApiLoaded && videoId) {
      initializePlayer();
    }
  }, [isApiLoaded, videoId]);

  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          setIsApiLoaded(true);
        };
      } else {
        setIsApiLoaded(true);
      }
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  const initializePlayer = useCallback(() => {
    if (!videoIdRef.current) return;

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player("youtube-player", {
      videoId: videoIdRef.current,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onPlaybackQualityChange: onPlaybackQualityChange,
      },
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        cc_load_policy: 3,
        disablekb: 1,
        autoplay: 1,
        start: Math.floor(initialTime),
      },
    });
  }, [initialTime]);

  const onPlayerReady = useCallback((event: any) => {
    setDuration(event.target.getDuration());
    setCurrentQuality(event.target.getPlaybackQuality());
    if (initialTime > 0) {
      event.target.seekTo(initialTime);
    }
  }, [initialTime, setDuration, setCurrentQuality]);

  const onPlayerStateChange = useCallback((event: any) => {
    const playerState = event.data;
    const currentTime = event.target.getCurrentTime();
    const videoDuration = event.target.getDuration();

    setIsPlaying(playerState === window.YT.PlayerState.PLAYING);

    // Check if we're at the end of the video (within 1 second)
    if (videoDuration - currentTime <= 0) {
      if (playerState === window.YT.PlayerState.PAUSED || playerState === window.YT.PlayerState.ENDED) {
        onVideoEnd?.();
        if (nextVideoId) {
          videoIdRef.current = nextVideoId;
          // Small delay to ensure clean transition
          setTimeout(() => {
            initializePlayer();
          }, 100);
        }
      }
    }
  }, [onVideoEnd, nextVideoId, initializePlayer, setIsPlaying]);

  const onPlaybackQualityChange = useCallback((event: any) => {
    setCurrentQuality(event.data);
  }, [setCurrentQuality]);

  useEffect(() => {
    if (!playerRef.current || !playerRef.current.getCurrentTime) return;
    if (!isDragging) {
      const updateProgress = () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          const videoDuration = playerRef.current.getDuration();

          // Check if we're at the end of the video (within 1 second)
          if (videoDuration - currentTime <= 1) {
            if (!isPlaying) {
              onVideoEnd?.();
              if (nextVideoId) {
                videoIdRef.current = nextVideoId;
                initializePlayer();
              }
            }
          }

          setProgress((currentTime / duration) * 100);
          onTimeUpdate?.(currentTime);
        }
      };

      const intervalId = setInterval(updateProgress, 250); // Increased frequency for better end detection
      return () => clearInterval(intervalId);
    }
  }, [duration, onTimeUpdate, onVideoEnd, nextVideoId, initializePlayer, isPlaying, setProgress, isDragging]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
  }, [isPlaying]);

  const handleMute = useCallback(() => {
    if (isMuted) {
      playerRef.current?.unMute();
    } else {
      playerRef.current?.mute();
    }
    setIsMuted(!isMuted);
  }, [isMuted, setIsMuted]);

  const handleProgressChange = useCallback((newProgress: number[]) => {
    const newTime = (newProgress[0] / 100) * duration;
    playerRef.current?.seekTo(newTime);
    onTimeUpdate?.(newTime);
  }, [duration, onTimeUpdate]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleQualityChange = useCallback((newQuality: string) => {
    playerRef.current?.setPlaybackQuality(newQuality);
    setQuality(newQuality);
  }, [setQuality]);

  const handleSkip = useCallback((seconds: number) => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + seconds);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    const volumeValue = newVolume[0];
    if (playerRef.current) {
      playerRef.current.setVolume(volumeValue);
      setVolume(volumeValue);
      setIsMuted(volumeValue === 0);
    }
  }, [setIsMuted]);


  const handleTheaterMode = useCallback(() => {
    setIsTheaterMode(prev => !prev);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleProgressMouseDown = () => setIsDragging(true);
  const handleProgressMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Keyboard shortcuts
  useHotkeys('space', () => handlePlayPause(), [handlePlayPause]);
  useHotkeys('m', () => handleMute(), [handleMute]);
  useHotkeys('f', () => handleFullscreen(), [handleFullscreen]);
  useHotkeys('left', () => handleSkip(-skipSeconds), [handleSkip, skipSeconds]);
  useHotkeys('right', () => handleSkip(skipSeconds), [handleSkip, skipSeconds]);
  useHotkeys('up', () => handleVolumeChange([Math.min(volume + 5, 100)]), [handleVolumeChange, volume]);
  useHotkeys('down', () => handleVolumeChange([Math.max(volume - 5, 0)]), [handleVolumeChange, volume]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (!isDragging && !isSettingsOpen) { // Updated condition to check isSettingsOpen
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isDragging, isSettingsOpen]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => setShowControls(false));
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', () => setShowControls(false));
      }
    };
  }, [handleMouseMove]);

  const qualityLabels: { [key: string]: string } = {
    auto: "Auto",
    hd1080: "1080p",
    hd720: "720p",
    large: "480p",
    medium: "360p",
    small: "240p",
    tiny: "144p",
  };

  return (
    <div className={`w-full ${isTheaterMode ? 'max-w-none' : 'max-w-4xl'}`}>
      
      <Card 
        className={`w-full overflow-hidden relative ${theme === 'dark' ? 'bg-black text-white' : ''}`} 
        ref={containerRef}
      >
        <CardContent className="p-0">
          <div className="aspect-video relative">
            <div 
              id="youtube-player" 
              className="w-full h-full absolute inset-0 z-0"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            
            {videoId && showControls && (
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 space-y-2 pointer-events-auto">
                  <div className="px-4">
                    <Slider
                      value={[progress]}
                      onValueChange={handleProgressChange}
                      onMouseDown={handleProgressMouseDown}
                      onMouseUp={handleProgressMouseUp}
                      max={100}
                      step={0.1}
                      className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&>span:first-child_span]:bg-blue-500"
                      aria-label="Video progress"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 pb-2">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMute}
                        className="hover:bg-white/10"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSkip(-skipSeconds)}
                        className="hover:bg-white/10"
                        aria-label={`Rewind ${skipSeconds} seconds`}
                      >
                        <Rewind className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePlayPause}
                        className="hover:bg-white/10"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSkip(skipSeconds)}
                        className="hover:bg-white/10"
                        aria-label={`Fast forward ${skipSeconds} seconds`}
                      >
                        <FastForward className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRotate}
                        className="hover:bg-white/10"
                        aria-label="Rotate video"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>

                      <div className="text-sm text-white/90 min-w-[120px]">
                        {formatTime(Math.floor((progress / 100) * duration))} / {formatTime(duration)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleTheaterMode}
                        className="hover:bg-white/10"
                        aria-label="Theater mode"
                      >
                        <MonitorPlay className="h-5 w-5" />
                      </Button>

                      <DropdownMenu onOpenChange={setIsSettingsOpen}> {/* Added onOpenChange prop */}
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-white/10"
                            aria-label="Change quality"
                          >
                            <Settings className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {Object.entries(qualityLabels).map(([value, label]) => (
                            <DropdownMenuItem key={value} onClick={() => handleQualityChange(value)}>
                              {label} {value === currentQuality && "(Current)"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFullscreen}
                        className="hover:bg-white/10"
                        aria-label="Fullscreen"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => (
  <VideoPlayerProvider>
    <VideoPlayerInner {...props} />
  </VideoPlayerProvider>
);

export default VideoPlayer;

