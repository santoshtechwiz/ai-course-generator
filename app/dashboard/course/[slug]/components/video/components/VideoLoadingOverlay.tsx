"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface VideoLoadingOverlayProps {
  videoId?: string;
  onTimeout?: () => void;
  timeoutDuration?: number;
}

export default function VideoLoadingOverlay({
  videoId,
  onTimeout,
  timeoutDuration = 15000,
}: VideoLoadingOverlayProps) {
  const [showingFor, setShowingFor] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Reset timer when videoId changes
  useEffect(() => {
    setShowingFor(0);
    setShowHelp(false);
  }, [videoId]);

  // Increment timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setShowingFor((prev) => {
        const newValue = prev + 1000;

        // Show help text after 5 seconds
        if (newValue >= 5000 && !showHelp) {
          setShowHelp(true);
        }

        // Trigger timeout callback
        if (newValue >= timeoutDuration && onTimeout) {
          onTimeout();
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout, timeoutDuration, showHelp]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
      <p className="text-white/90 font-medium text-center">
        Loading video player...
      </p>

      {showHelp && (
        <div className="mt-6 max-w-xs text-white/70 text-sm text-center">
          <p>This is taking longer than expected.</p>
          <p className="mt-2">
            If loading continues, try refreshing the page or check your internet
            connection.
          </p>
        </div>
      )}
    </div>
  );
}
