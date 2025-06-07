import React, { useMemo } from "react";
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, 
  Maximize, Bookmark, Keyboard, Monitor, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/tailwindUtils";
import PlaybackSpeedMenu from "./PlaybackSpeedMenu";
import ProgressBar from "./ProgressBar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerControlsProps {
  show: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  played: number;
  loaded: number;
  duration: number;
  playbackSpeed: number;
  bufferHealth: number;
  bookmarks?: number[];
  nextVideoId?: string;
  theaterMode: boolean;
  formatTime: (time: number) => string;
  onPlayPause: () => void;
  onMute: () => void;
  onVolumeChange: (value: number) => void;
  onSeekChange: (value: number) => void;
  onSkip: (seconds: number) => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onAddBookmark: () => void;
  onSeekToBookmark?: (time: number) => void;
  onFullscreenToggle: () => void;
  onTheaterMode: () => void;
  onShowKeyboardShortcuts: () => void;
  onNextVideo?: () => void;
}

// Optimize control buttons with memoization
const PlayPauseButton = React.memo(({ playing, onClick }: { playing: boolean, onClick: () => void }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-white hover:bg-white/20"
        onClick={onClick}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{playing ? "Pause (Space)" : "Play (Space)"}</TooltipContent>
  </Tooltip>
));

PlayPauseButton.displayName = "PlayPauseButton";

const PlayerControls: React.FC<PlayerControlsProps> = ({
  show,
  playing,
  muted,
  volume,
  played,
  loaded,
  duration,
  playbackSpeed,
  bufferHealth,
  bookmarks = [],
  nextVideoId,
  theaterMode,
  formatTime,
  onPlayPause,
  onMute,
  onVolumeChange,
  onSeekChange,
  onSkip,
  onPlaybackSpeedChange,
  onAddBookmark,
  onSeekToBookmark,
  onFullscreenToggle,
  onTheaterMode,
  onShowKeyboardShortcuts,
  onNextVideo,
}) => {
  // Memoize the current time calculation to prevent unnecessary recalculations
  const currentTime = useMemo(() => duration * played, [duration, played]);
  
  return (
    <TooltipProvider delayDuration={500}>
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-3 transition-opacity bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2",
        show ? "opacity-100" : "opacity-0",
        "md:p-4"
      )}>
        {/* Progress bar */}
        <ProgressBar
          played={played}
          loaded={loaded}
          onSeek={onSeekChange}
          bufferHealth={bufferHealth}
          duration={duration}
          formatTime={formatTime}
          bookmarks={bookmarks}
          onSeekToBookmark={onSeekToBookmark}
        />
        
        <div className="flex justify-between items-center">
          {/* Left controls */}
          <div className="flex items-center gap-1">
            {/* Play/Pause button */}
            <PlayPauseButton playing={playing} onClick={onPlayPause} />

            {/* Skip backward button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => onSkip(-10)}
                  aria-label="Rewind 10 seconds"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rewind 10s (←)</TooltipContent>
            </Tooltip>

            {/* Skip forward button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20" 
                  onClick={() => onSkip(10)}
                  aria-label="Forward 10 seconds"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward 10s (→)</TooltipContent>
            </Tooltip>

            {/* Volume controls */}
            <div className="hidden md:flex items-center gap-1 group relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={onMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-0 group-hover:w-16 overflow-hidden transition-all duration-300">
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  className="w-16"
                  onValueChange={(value: number[]) => onVolumeChange(value[0] / 100)}
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Time display */}
            <div className="text-xs text-white ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Add bookmark button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={onAddBookmark}
                  aria-label="Add bookmark"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add bookmark (B)</TooltipContent>
            </Tooltip>

            {/* Playback speed */}
            <PlaybackSpeedMenu 
              currentSpeed={playbackSpeed} 
              onSpeedChange={onPlaybackSpeedChange} 
            />

            {/* Keyboard shortcuts button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={onShowKeyboardShortcuts}
                  aria-label="Keyboard shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
            </Tooltip>

            {/* Theater mode button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={onTheaterMode}
                  aria-label={theaterMode ? "Exit theater mode" : "Enter theater mode"}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theaterMode ? "Exit theater mode (T)" : "Theater mode (T)"}
              </TooltipContent>
            </Tooltip>

            {/* Settings button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video settings</TooltipContent>
            </Tooltip>

            {/* Fullscreen button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={onFullscreenToggle}
                  aria-label="Toggle fullscreen"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen (F)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default React.memo(PlayerControls);
