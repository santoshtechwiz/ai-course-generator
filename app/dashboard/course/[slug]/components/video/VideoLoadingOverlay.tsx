import React from "react";

interface VideoLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

/**
 * Simple VideoLoadingOverlay - all loading is handled by the global loader
 */
const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ 
  isVisible,
  message = "Loading video..."
}) => {
  if (!isVisible) return null;

  // Return a simple overlay that doesn't interfere with global loader
  return (
    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-black/80 z-10">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default React.memo(VideoLoadingOverlay);

// [DELETED: All loader logic is now handled by the centralized loader system in components/loaders.]
