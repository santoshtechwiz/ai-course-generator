import React, { useEffect } from "react";
import { useGlobalLoading } from "@/store/slices/global-loading-slice";

interface VideoLoadingOverlayProps {
  isVisible: boolean;
}

const VideoLoadingOverlay: React.FC<VideoLoadingOverlayProps> = ({ isVisible }) => {
  const { showLoading, hideLoading } = useGlobalLoading()

  useEffect(() => {
    let loaderId: string | null = null

    if (isVisible) {
      loaderId = showLoading({
        message: "Loading video player...",
        subMessage: "Please wait while we prepare your content",
        variant: 'spinner',
        theme: 'primary',
        isBlocking: true,
        priority: 5
      })
    }

    return () => {
      if (loaderId) {
        hideLoading(loaderId)
      }
    }
  }, [isVisible, showLoading, hideLoading])

  return null; // Loading handled by GlobalLoader
};

export default React.memo(VideoLoadingOverlay);
