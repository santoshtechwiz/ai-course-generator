import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";

interface ProgressBarProps {
  played: number;
  loaded: number;
  onSeek: (value: number) => void;
  bufferHealth: number;
  duration: number;
  formatTime: (seconds: number) => string;
  bookmarks?: number[];
  onSeekToBookmark?: (time: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  played,
  loaded,
  onSeek,
  bufferHealth,
  duration,
  formatTime,
  bookmarks = [],
  onSeekToBookmark,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const throttleRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Throttle mouse move updates for better performance
    if (throttleRef.current !== null) {
      return;
    }
    
    throttleRef.current = window.setTimeout(() => {
      throttleRef.current = null;
    }, 30); // 30ms throttle

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    const position = Math.max(0, Math.min(1, x / width));
    setHoverPosition(position);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    const position = Math.max(0, Math.min(1, x / width));
    onSeek(position);
  }, [onSeek]);

  const hoverTime = hoverPosition !== null ? duration * hoverPosition : null;

  // Memoize bookmarks for better rendering performance
  const renderedBookmarks = useMemo(() => {
    // Only render bookmarks if we have duration
    if (!duration || bookmarks.length === 0) return null;
    
    return bookmarks.map((time, index) => {
      const position = duration > 0 ? (time / duration) * 100 : 0;
      return (
        <div
          key={`${time}-${index}`}
          className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-primary-foreground rounded cursor-pointer z-10 transform transition-transform hover:scale-150"
          style={{ left: `${position}%` }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            onSeekToBookmark?.(time);
          }}
          title={`Bookmark at ${formatTime(time)}`}
        />
      );
    });
  }, [bookmarks, duration, formatTime, onSeekToBookmark]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (throttleRef.current !== null) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full relative group">
      {/* Buffer health indicator */}
      {bufferHealth < 20 && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-background/90 text-xs px-2 py-1 rounded shadow">
          Buffering... {Math.round(bufferHealth)}%
        </div>
      )}

      {/* Time tooltip on hover */}
      {hoverPosition !== null && (
        <div
          className="absolute -top-8 bg-background/90 px-2 py-1 rounded text-xs font-mono transform -translate-x-1/2 shadow"
          style={{ left: `${hoverPosition * 100}%` }}
        >
          {formatTime(hoverTime || 0)}
        </div>
      )}

      <div
        className="w-full h-2 group-hover:h-3 bg-muted rounded-full cursor-pointer overflow-hidden transition-all relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Loaded progress */}
        <div
          className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded-full"
          style={{ width: `${loaded * 100}%` }}
        />

        {/* Played progress */}
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          style={{ width: `${played * 100}%` }}
        />

        {/* Bookmarks */}
        {renderedBookmarks}
      </div>
    </div>
  );
};

export default React.memo(ProgressBar);
