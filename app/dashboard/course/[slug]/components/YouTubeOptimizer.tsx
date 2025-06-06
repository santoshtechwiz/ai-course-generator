"use client"

import { useEffect } from 'react'

// Add these types to accommodate the YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    __YOUTUBE_OPTIMIZED__: boolean;
  }
}

export default function YouTubeOptimizer() {
  useEffect(() => {
    // Don't run multiple times
    if (typeof window !== 'undefined' && window.__YOUTUBE_OPTIMIZED__) {
      return;
    }
    
    try {
      // Add preconnect links to speed up connection to YouTube domains
      if (typeof document !== 'undefined') {
        const domains = [
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://i.ytimg.com',
          'https://s.ytimg.com',
          'https://www.google.com',
        ];
        
        domains.forEach(domain => {
          // Check if preconnect already exists
          const existingPreconnect = document.querySelector(`link[rel="preconnect"][href="${domain}"]`);
          if (!existingPreconnect) {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            document.head.appendChild(link);
            
            // Add DNS prefetch as fallback
            const dns = document.createElement('link');
            dns.rel = 'dns-prefetch';
            dns.href = domain;
            document.head.appendChild(dns);
          }
        });
        
        // Set flag to avoid duplicate initialization
        if (typeof window !== 'undefined') {
          window.__YOUTUBE_OPTIMIZED__ = true;
        }
      }
    } catch (err) {
      console.warn("Failed to optimize YouTube connections:", err);
    }
    
    return () => {
      // Cleanup not needed, preconnect links can stay
    }
  }, []);
  
  // This component doesn't render anything
  return null;
}
