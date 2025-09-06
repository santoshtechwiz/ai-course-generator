/**
 * Utility functions for handling image URLs and fallbacks
 */

export function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/course-card.svg'
  }

  // If it's already a full URL or starts with http/https, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it starts with /, it's already a proper path
  if (imageUrl.startsWith('/')) {
    return imageUrl
  }

  // If it's just a filename, assume it's in the images directory
  if (!imageUrl.includes('/')) {
    return `/images/${imageUrl}`
  }

  // For any other case, return the fallback
  return '/not.svg'
}

export function getImageWithFallback(
  primaryImage: string | null | undefined,
  fallbackImage: string = '/course-card.svg'
): string {
  const normalized = normalizeImageUrl(primaryImage)
  return normalized || fallbackImage
}

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false

  // Check if it's a proper URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }

  // Check if it's a local path that exists
  if (url.startsWith('/')) {
    // For now, assume local paths are valid if they start with /
    // In a real implementation, you might want to check against a list of known images
    return true
  }

  return false
}
