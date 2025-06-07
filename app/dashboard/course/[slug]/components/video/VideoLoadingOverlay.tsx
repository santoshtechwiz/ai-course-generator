import React from "react";

interface VideoLoadingOverlayProps {
  isVisible: boolean;
}

const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-black/80 z-10">
      <div className="flex flex-col items-center text-center">
        <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-white mx-auto mb-2 md:mb-4" />
        <div className="text-white text-sm md:text-lg font-medium">Loading video player...</div>
        <div className="text-white/70 text-xs md:text-sm mt-1 md:mt-2">Please wait while we prepare your content</div>
      </div>
    </div>
  );
};

export default React.memo(VideoLoadingOverlay);
