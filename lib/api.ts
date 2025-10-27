/**
 * Centralized API client using native fetch with TypeScript support
 */

import { toast } from "@/components/ui/use-toast"

// Types
interface ApiResponse<T = any> {
  data: T
  error?: string
  status: number
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  data?: any
  baseUrl?: string
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

// Error handling helper
const handleApiError = (error: any): never => {
  console.error("API Error:", error)
  const message = error?.message || "An unexpected error occurred"
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  })
  throw error
}

// URL parameter helper
const createUrlWithParams = (url: string, params?: Record<string, any>): string => {
  if (!params) return url
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}

// Main API client
export const api = {
  async request<T>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    try {
      const {
        params,
        data,
        headers = {},
        baseUrl = "",
        ...fetchOptions
      } = options

      const fullUrl = createUrlWithParams(`${baseUrl}${url}`, params)
      
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers: {
          ...DEFAULT_HEADERS,
          ...headers,
        },
        ...(data && { body: JSON.stringify(data) }),
      })

      // Handle non-2xx responses
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `HTTP error! status: ${response.status}`)
      }

      // Handle no content responses
      if (response.status === HTTP_STATUS.NO_CONTENT) {
        return { data: {} as T, status: response.status }
      }

      const responseData = await response.json()
      return { data: responseData, status: response.status }
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Convenience methods
  get<T>(url: string, options?: FetchOptions) {
    return this.request<T>(url, { ...options, method: "GET" })
  },

  post<T>(url: string, data?: any, options?: FetchOptions) {
    return this.request<T>(url, { ...options, method: "POST", data })
  },

  put<T>(url: string, data?: any, options?: FetchOptions) {
    return this.request<T>(url, { ...options, method: "PUT", data })
  },

  patch<T>(url: string, data?: any, options?: FetchOptions) {
    return this.request<T>(url, { ...options, method: "PATCH", data })
  },

  delete<T>(url: string, options?: FetchOptions) {
    return this.request<T>(url, { ...options, method: "DELETE" })
  }
}

// Export singleton instance

