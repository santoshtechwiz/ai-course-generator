import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoErrorStateProps {
  onReload: () => void;
  onRetry: () => void;
}

const VideoErrorState: React.FC<VideoErrorStateProps> = ({ onReload, onRetry }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-black/80 z-10">
      <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 md:p-8 shadow-xl max-w-sm md:max-w-md mx-auto text-center border">
        <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-destructive mx-auto mb-3 md:mb-4" />
        <h3 className="text-lg md:text-xl font-semibold mb-2">Video Unavailable</h3>
        <div className="text-muted-foreground mb-4 md:mb-6 text-xs md:text-sm leading-relaxed">
          This video is currently unavailable. This may be due to network issues or the video being temporarily unavailable.
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <Button variant="outline" onClick={onReload} className="flex items-center gap-2 text-xs md:text-sm">
            <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
            Reload Page
          </Button>
          <Button onClick={onRetry} className="flex items-center gap-2 text-xs md:text-sm">
            <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoErrorState;
