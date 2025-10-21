/**
 * Simple fetch helper to replace axios calls
 */

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

export const apiRequest = async (url: string, options: FetchOptions = {}) => {
  const { params, ...fetchOptions } = options

  // Handle query parameters
  let finalUrl = url
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      finalUrl += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const response = await fetch(finalUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Convenience methods
export const api = {
  get: (url: string, options?: FetchOptions) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url: string, data?: any, options?: FetchOptions) => apiRequest(url, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data?: any, options?: FetchOptions) => apiRequest(url, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (url: string, data?: any, options?: FetchOptions) => apiRequest(url, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url: string, options?: FetchOptions) => apiRequest(url, { ...options, method: 'DELETE' }),
}
