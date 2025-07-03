import React from "react";
import { GlobalLoader } from "@/components/ui/loader";

interface VideoLoadingOverlayProps {
  isVisible: boolean;
}

const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-black/80 z-10">
      <GlobalLoader 
        size="lg" 
        text="Loading video player..." 
        subText="Please wait while we prepare your content"
        theme="primary"
        className="text-white"
      />
    </div>
  );
};

export default React.memo(VideoLoadingOverlay);
