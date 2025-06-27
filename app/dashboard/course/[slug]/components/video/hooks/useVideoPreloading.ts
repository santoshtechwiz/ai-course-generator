import { useEffect, useRef } from 'react';

/**
 * Hook that preloads the next video in a playlist for smoother transitions
 */
export function useVideoPreloading({
  currentVideoId, 
  nextVideoId,
  isNearingCompletion
}: {
  currentVideoId: string | null,
  nextVideoId: string | null, // Ensure this accepts null
  isNearingCompletion: boolean
}) {
  const preloadLinkRef = useRef<HTMLLinkElement | null>(null);
  const preconnectLinkRef = useRef<HTMLLinkElement | null>(null);
  const prefetchLinkRef = useRef<HTMLLinkElement | null>(null);
  
  useEffect(() => {
    // Only preload when the current video is nearing completion and we have a next video
    if (!isNearingCompletion || !nextVideoId) {
      // Safely remove preload elements if they exist
      if (preloadLinkRef.current) {
        try {
          // Check if the element is actually in the document
          if (preloadLinkRef.current.parentNode === document.head) {
            document.head.removeChild(preloadLinkRef.current);
          }
          preloadLinkRef.current = null;
        } catch (err) {
          console.warn("Failed to remove preload link:", err);
        }
      }
      
      if (preconnectLinkRef.current) {
        try {
          // Check if the element is actually in the document
          if (preconnectLinkRef.current.parentNode === document.head) {
            document.head.removeChild(preconnectLinkRef.current);
          }
          preconnectLinkRef.current = null;
        } catch (err) {
          console.warn("Failed to remove preconnect link:", err);
        }
      }
      
      if (prefetchLinkRef.current) {
        try {
          // Check if the element is actually in the document
          if (prefetchLinkRef.current.parentNode === document.head) {
            document.head.removeChild(prefetchLinkRef.current);
          }
          prefetchLinkRef.current = null;
        } catch (err) {
          console.warn("Failed to remove prefetch link:", err);
        }
      }
      
      return;
    }
    
    // Don't create duplicate preload elements
    if (preloadLinkRef.current) return;
    
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[VideoPreloading] Preloading next video: ${nextVideoId}`);
      }
      
      // Create a preload link for the YouTube thumbnail
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = `https://img.youtube.com/vi/${nextVideoId}/maxresdefault.jpg`;
      document.head.appendChild(preloadLink);
      preloadLinkRef.current = preloadLink;
      
      // Create a preconnect to YouTube
      const preconnectLink = document.createElement('link');
      preconnectLink.rel = 'preconnect';
      preconnectLink.href = 'https://www.youtube.com';
      document.head.appendChild(preconnectLink);
      preconnectLinkRef.current = preconnectLink;
      
      // Add DNS prefetch for better performance
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'dns-prefetch';
      prefetchLink.href = 'https://www.youtube.com';
      document.head.appendChild(prefetchLink);
      prefetchLinkRef.current = prefetchLink;
    } catch (error) {
      console.warn('Failed to preload next video:', error);
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (preloadLinkRef.current) {
        try {
          // Safe removal with parent node check
          if (preloadLinkRef.current.parentNode === document.head) {
            document.head.removeChild(preloadLinkRef.current);
          }
        } catch (err) {
          console.warn("Failed to remove preload link during cleanup:", err);
        }
      }
      
      if (preconnectLinkRef.current) {
        try {
          // Safe removal with parent node check
          if (preconnectLinkRef.current.parentNode === document.head) {
            document.head.removeChild(preconnectLinkRef.current);
          }
        } catch (err) {
          console.warn("Failed to remove preconnect link during cleanup:", err);
        }
      }
      
      if (prefetchLinkRef.current) {
        try {
          // Safe removal with parent node check
          if (prefetchLinkRef.current.parentNode === document.head) {
            document.head.removeChild(prefetchLinkRef.current);
          }
        } catch (err) {
          console.warn("Failed to remove prefetch link during cleanup:", err);
        }
      }
    };
  }, [currentVideoId, nextVideoId, isNearingCompletion]);
}
