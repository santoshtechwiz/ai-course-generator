/**
 * Helper utilities to improve video loading reliability
 */

/**
 * Creates a preconnect hint for YouTube domains to improve loading speed
 */
export function addYouTubePreconnect() {
  if (typeof document === 'undefined') return;
  
  const domains = [
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://i.ytimg.com',
    'https://s.ytimg.com',
    'https://www.google.com'
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
}

/**
 * Preloads YouTube API to ensure it's available when needed
 */
export function preloadYouTubeAPI() {
  if (typeof document === 'undefined') return;
  if (window.YT) return; // Already loaded
  
  return new Promise((resolve, reject) => {
    // Add YouTube API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    // Add a success handler
    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT);
    };
    
    // Add error handling
    tag.onerror = () => {
      reject(new Error('YouTube API failed to load'));
    };
    
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(tag, firstScript);
  });
}

/**
 * Tests whether a YouTube video ID is valid and accessible
 */
export async function validateYouTubeVideo(videoId: string): Promise<boolean> {
  try {
    // Use YouTube oEmbed API to validate the video
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    return response.status === 200;
  } catch (error) {
    console.error('Error validating YouTube video:', error);
    return false;
  }
}

/**
 * Checks if current browser has a limitation with YouTube embeds
 */
export function detectBrowserIssues(): string[] {
  const issues = [];
  const ua = navigator.userAgent;
  
  // Old Safari versions have YouTube embedding issues
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    if (/Version\/[0-9]\./.test(ua)) {
      issues.push('oldSafari');
    }
  }
  
  // Track-blocking browsers can interfere with YouTube
  if (
    navigator.doNotTrack === '1' || 
    navigator.doNotTrack === 'yes' || 
    window.doNotTrack === '1'
  ) {
    issues.push('trackingProtection');
  }
  
  return issues;
}
