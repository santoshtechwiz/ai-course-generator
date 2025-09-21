/**
 * Utility for handling API URLs in both client and server contexts
 */

/**
 * Get the full URL for API calls (handles both client and server contexts)
 * @param endpoint - The API endpoint (should start with /)
 * @returns Full URL for the endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // If we're on the client side, use relative URLs
  if (typeof window !== 'undefined') {
    return cleanEndpoint
  }
  
  // Server side - need full URL
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  let host = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'localhost:3000'
  
  // Clean the host (remove protocol if present)
  host = host.replace(/^https?:\/\//, '')
  
  return `${protocol}://${host}${cleanEndpoint}`
}

/**
 * Create a fetch wrapper that uses the correct URL for the environment
 * @param endpoint - The API endpoint
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint)
  return fetch(url, {
    ...options,
    credentials: options?.credentials || 'include'
  })
}

/**
 * Determine if we're running on the server side
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined'
}

/**
 * Determine if we're running on the client side
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined'
}