/**
 * URL and Navigation Utilities
 * 
 * Consolidated URL handling and navigation utilities.
 */

// ============================================================================
// BASE URL UTILITIES
// ============================================================================

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "" // browser should use relative url
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL // SSR should use NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

/**
 * Get the full site URL
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 
         process.env.NEXTAUTH_URL || 
         getBaseUrl()
}

// ============================================================================
// URL BUILDING
// ============================================================================

/**
 * Build quiz URL with proper formatting
 */
export function buildQuizUrl(quizId: string, type?: string): string {
  const baseUrl = getBaseUrl()
  const path = type ? `/dashboard/${type}/${quizId}` : `/dashboard/mcq/${quizId}`
  return `${baseUrl}${path}`
}

/**
 * Build course URL
 */
export function buildCourseUrl(courseSlug: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/dashboard/course/${courseSlug}`
}

/**
 * Create share URL with tracking parameters
 */
export function createShareUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, getSiteUrl())
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}

/**
 * Build API endpoint URL
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/api/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const siteUrl = new URL(getSiteUrl())
    return urlObj.hostname !== siteUrl.hostname
  } catch (_) {
    return false
  }
}

// ============================================================================
// URL PARSING
// ============================================================================

/**
 * Extract URL parameters as object
 */
export function getUrlParams(url?: string): Record<string, string> {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  if (!targetUrl) return {}
  
  try {
    const urlObj = new URL(targetUrl)
    const params: Record<string, string> = {}
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  } catch (_) {
    return {}
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (_) {
    return null
  }
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    
    // Handle different YouTube URL formats
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.split('/').pop() || null
    }
    
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v')
    }
    
    // If it's just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url
    }
    
    return null
  } catch (_) {
    // If URL parsing fails, check if it's just an ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url
    }
    return null
  }
}

// ============================================================================
// ROUTE UTILITIES
// ============================================================================

/**
 * Check if current route matches pattern
 */
export function matchesRoute(pattern: string, path?: string): boolean {
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '')
  
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\[.*?\]/g, '[^/]+') // Replace [param] with regex
    .replace(/\*/g, '.*') // Replace * with regex
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(currentPath)
}

/**
 * Get route parameters from path
 */
export function getRouteParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {}
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')
  
  if (patternParts.length !== pathParts.length) return params
  
  patternParts.forEach((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1)
      params[paramName] = pathParts[index]
    }
  })
  
  return params
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Safely navigate to URL (client-side only)
 */
export function navigateTo(url: string, newTab: boolean = false): void {
  if (typeof window === 'undefined') return
  
  if (newTab) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    window.location.href = url
  }
}

/**
 * Go back in browser history
 */
export function goBack(): void {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
  }
}

/**
 * Reload current page
 */
export function reloadPage(): void {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
