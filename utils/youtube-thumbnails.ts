/**
 * YouTube Thumbnail Utilities
 * 
 * Provides utilities for generating and validating YouTube thumbnail URLs
 * with proper fallback mechanisms to prevent 404 errors.
 */

export type YouTubeThumbnailQuality = 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'default';

export interface YouTubeThumbnailOptions {
  videoId: string;
  quality?: YouTubeThumbnailQuality;
  fallback?: string;
}

/**
 * Generate YouTube thumbnail URL with specified quality
 */
export function getYouTubeThumbnailUrl(
  videoId: string, 
  quality: YouTubeThumbnailQuality = 'hqdefault'
): string {
  if (!videoId || typeof videoId !== 'string') {
    return '/images/placeholder.svg';
  }
  
  // Clean video ID (remove any extra parameters)
  const cleanVideoId = videoId.trim().split('?')[0].split('&')[0];
  
  if (cleanVideoId.length !== 11) {
    console.warn(`Invalid YouTube video ID: ${videoId}`);
    return '/images/placeholder.svg';
  }
  
  return `https://img.youtube.com/vi/${cleanVideoId}/${quality}.jpg`;
}

/**
 * Get all available thumbnail URLs in order of preference (best to worst quality)
 */
export function getYouTubeThumbnailFallbacks(videoId: string): string[] {
  if (!videoId || typeof videoId !== 'string') {
    return ['/images/placeholder.svg'];
  }
  
  const cleanVideoId = videoId.trim().split('?')[0].split('&')[0];
  
  if (cleanVideoId.length !== 11) {
    return ['/images/placeholder.svg'];
  }
  
  return [
    `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,      // 480x360 (most reliable)
    `https://img.youtube.com/vi/${cleanVideoId}/mqdefault.jpg`,      // 320x180 (medium quality)
    `https://img.youtube.com/vi/${cleanVideoId}/default.jpg`,        // 120x90 (always available)
    '/images/placeholder.svg'                                        // Local fallback
  ];
}

/**
 * Validate if a YouTube video ID appears to be valid format
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  if (!videoId || typeof videoId !== 'string') {
    return false;
  }
  
  const cleanVideoId = videoId.trim().split('?')[0].split('&')[0];
  
  // YouTube video IDs are exactly 11 characters long
  // and contain only alphanumeric characters, hyphens, and underscores
  return /^[a-zA-Z0-9_-]{11}$/.test(cleanVideoId);
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Handle direct video ID
  if (isValidYouTubeVideoId(url)) {
    return url;
  }
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Create error handler for Image onError that implements fallback strategy
 */
export function createThumbnailErrorHandler(videoId: string) {
  const fallbacks = getYouTubeThumbnailFallbacks(videoId);
  let currentIndex = 0;
  
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const currentSrc = target.src;
    
    // Find current fallback index
    const currentFallbackIndex = fallbacks.findIndex(url => url === currentSrc);
    
    if (currentFallbackIndex >= 0 && currentFallbackIndex < fallbacks.length - 1) {
      // Try next fallback
      target.src = fallbacks[currentFallbackIndex + 1];
    } else {
      // Use final fallback if not already using it
      if (!currentSrc.includes('placeholder.svg')) {
        target.src = '/images/placeholder.svg';
      }
    }
  };
}

/**
 * Pre-validate a YouTube thumbnail URL before using it
 * Returns a Promise that resolves to a working URL or fallback
 */
export async function validateYouTubeThumbnail(videoId: string): Promise<string> {
  const fallbacks = getYouTubeThumbnailFallbacks(videoId);
  
  for (const url of fallbacks) {
    try {
      // Skip validation for local files
      if (url.startsWith('/')) {
        return url;
      }
      
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
    } catch (error) {
      // Continue to next fallback
      continue;
    }
  }
  
  // Return final fallback if all else fails
  return '/images/placeholder.svg';
}

export default {
  getYouTubeThumbnailUrl,
  getYouTubeThumbnailFallbacks,
  isValidYouTubeVideoId,
  extractYouTubeVideoId,
  createThumbnailErrorHandler,
  validateYouTubeThumbnail
};