"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Settings,
  Bookmark,
  PictureInPictureIcon as Picture,
  Subtitles,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  CheckCircle,
  Trash,
  RotateCcw as RestartIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/tailwindUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoControlsProps {
  show: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  played: number;
  loaded: number;
  duration: number;
  fullscreen: boolean;
  playbackSpeed: number;
  autoplayNext: boolean;
  bookmarks?: number[];
  nextVideoId?: string;
  theaterMode: boolean;
  showSubtitles: boolean;
  isMobile?: boolean;
  courseCompleted?: boolean;
  onPlayPause: () => void;
  onSkip: (seconds: number) => void;
  onMute: () => void;
  onVolumeChange: (volume: number) => void;
  onFullscreenToggle: () => void;
  onNextVideo?: () => void;
  onSeekMouseDown: (value: number) => void;
  onSeekChange: (value: number) => void;
  onSeekMouseUp: () => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onAutoplayToggle: () => void;
  onSeekToBookmark: (time: number) => void;
  onAddBookmark: () => void;
  onPictureInPicture: () => void;
  onTheaterMode: () => void;
  onToggleSubtitles: () => void;
  onRestartCourse?: () => void;
  formatTime: (seconds: number) => string;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  show,
  playing,
  muted,
  volume,
  played,
  loaded,
  duration,
  fullscreen,
  playbackSpeed,
  autoplayNext,
  bookmarks = [],
  nextVideoId,
  theaterMode,
  showSubtitles,
  isMobile = false,
  courseCompleted = false,
  onPlayPause,
  onSkip,
  onMute,
  onVolumeChange,
  onFullscreenToggle,
  onNextVideo,
  onSeekMouseDown,
  onSeekChange,
  onSeekMouseUp,
  onPlaybackSpeedChange,
  onAutoplayToggle,
  onSeekToBookmark,
  onAddBookmark,
  onPictureInPicture,
  onTheaterMode,
  onToggleSubtitles,
  onRestartCourse = () => {}, // Add default empty function
  formatTime,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Count valid bookmarks for UI
  const validBookmarks = bookmarks.filter((time) => time >= 0 && time <= duration);

  // Memoize formatted currentTime and totalTime for performance
  const currentTimeFormatted = formatTime(Math.floor(duration * played));
  const totalTimeFormatted = formatTime(Math.floor(duration));

  // Fix for mobile controls being too small
  const controlSize = isMobile ? "h-6 w-6" : "h-5 w-5";
  const buttonSize = isMobile ? "p-2" : "p-1.5";

  const handleVolumeMouseEnter = () => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = null;
    }
    setShowVolumeSlider(true);
  };

  const handleVolumeMouseLeave = () => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 500);
  };

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 py-6 transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Progress bar with smooth hover effect */}
      <div className="relative h-1.5 mb-3 cursor-pointer group hover:h-2.5 transition-all duration-150">
        <div className="absolute inset-0 bg-white/30 rounded-full" />
        <div
          className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
          style={{ width: `${loaded * 100}%` }}
        />
        <Slider
          value={[played * 100]}
          max={100}
          onValueChange={(value) => {
            onSeekChange(value[0] / 100);
          }}
          onPointerDown={() => {
            onSeekMouseDown(played);
          }}
          onPointerUp={() => {
            onSeekMouseUp();
          }}
          className="relative rounded-full bg-primary"
        />
        {/* Render bookmarks only if they're valid */}
        {validBookmarks.map((time, index) => (
          <div
            key={`bookmark-${index}-${time}`}
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-yellow-400 rounded-sm transition-all duration-150 hover:scale-125"
            style={{ left: `${(time / duration) * 100}%`, transform: "translateX(-50%) translateY(-50%)" }}
            onClick={(e) => {
              e.stopPropagation();
              onSeekToBookmark(time);
            }}
          />
        ))}
      </div>

      {/* Main controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={buttonSize}
            onClick={onPlayPause}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className={controlSize} /> : <Play className={controlSize} />}
          </Button>

          {/* Skip buttons - not shown on mobile to save space */}
          {!isMobile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSize}
                onClick={() => onSkip(-10)}
                aria-label="Skip back 10 seconds"
              >
                <SkipBack className={controlSize} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSize}
                onClick={() => onSkip(10)}
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className={controlSize} />
              </Button>
            </>
          )}

          <div
            className="relative"
            onMouseEnter={handleVolumeMouseEnter}
            onMouseLeave={handleVolumeMouseLeave}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onMute}
              className={buttonSize}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <VolumeX className={controlSize} />
              ) : volume > 0.5 ? (
                <Volume2 className={controlSize} />
              ) : (
                <Volume1 className={controlSize} />
              )}
            </Button>

            {showVolumeSlider && (
              <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 mb-2 bg-black/80 rounded-md p-2 w-24">
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => onVolumeChange(value[0] / 100)}
                  aria-label="volume"
                />
              </div>
            )}
          </div>

          {/* Time display */}
          <span className="text-xs md:text-sm text-white">
            {currentTimeFormatted} / {totalTimeFormatted}
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Bookmarks dropdown - hidden on mobile */}
          {!isMobile && (
            <DropdownMenu open={showBookmarkMenu} onOpenChange={setShowBookmarkMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={buttonSize}
                  aria-label="Bookmarks"
                >
                  <Bookmark className={controlSize} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onAddBookmark}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bookmark
                </DropdownMenuItem>

                {validBookmarks.length > 0 && <DropdownMenuSeparator />}

                {validBookmarks.map((time, index) => (
                  <DropdownMenuItem
                    key={`bookmark-menu-${index}`}
                    onClick={() => onSeekToBookmark(time)}
                  >
                    <span className="flex-1">Bookmark at {formatTime(time)}</span>
                  </DropdownMenuItem>
                ))}

                {validBookmarks.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                    No bookmarks yet
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSize}
                aria-label="Settings"
              >
                <Settings className={controlSize} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onFullscreenToggle}>
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize2 className="h-4 w-4 mr-2" />
                )}
                {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onPictureInPicture}>
                <Picture className="h-4 w-4 mr-2" />
                Picture-in-Picture
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onTheaterMode}>
                {theaterMode ? (
                  <Minimize className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize className="h-4 w-4 mr-2" />
                )}
                {theaterMode ? "Exit Theater Mode" : "Theater Mode"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onToggleSubtitles}>
                <Subtitles className="h-4 w-4 mr-2" />
                {showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onAutoplayToggle}>
                {autoplayNext ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <div className="h-4 w-4 mr-2 border border-foreground/50 rounded-full" />
                )}
                {autoplayNext ? "Disable Autoplay" : "Enable Autoplay"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onPlaybackSpeedChange(0.5)}
                className={playbackSpeed === 0.5 ? "bg-accent" : ""}
              >
                <span className="w-4 mr-2 text-center text-xs">0.5x</span>
                Speed: 0.5x
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onPlaybackSpeedChange(0.75)}
                className={playbackSpeed === 0.75 ? "bg-accent" : ""}
              >
                <span className="w-4 mr-2 text-center text-xs">0.75x</span>
                Speed: 0.75x
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onPlaybackSpeedChange(1)}
                className={playbackSpeed === 1 ? "bg-accent" : ""}
              >
                <span className="w-4 mr-2 text-center text-xs">1x</span>
                Speed: Normal
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onPlaybackSpeedChange(1.5)}
                className={playbackSpeed === 1.5 ? "bg-accent" : ""}
              >
                <span className="w-4 mr-2 text-center text-xs">1.5x</span>
                Speed: 1.5x
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onPlaybackSpeedChange(2)}
                className={playbackSpeed === 2 ? "bg-accent" : ""}
              >
                <span className="w-4 mr-2 text-center text-xs">2x</span>
                Speed: 2x
              </DropdownMenuItem>

              {courseCompleted && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRestartCourse}>
                    <RestartIcon className="h-4 w-4 mr-2" />
                    Restart Course
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen button */}
          <Button
            variant="ghost"
            size="icon"
            className={buttonSize}
            onClick={onFullscreenToggle}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? <Minimize2 className={controlSize} /> : <Maximize2 className={controlSize} />}
          </Button>
        </div>
      </div>
    </div>
  );
};
