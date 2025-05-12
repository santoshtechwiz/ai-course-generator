"use client"

import { useState, useCallback } from "react"
import { useLoading } from "@/components/ui/loading/loading-provider"

interface ApiOptions extends RequestInit {
  showLoading?: boolean
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
}

export function useApi() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const { startLoading, stopLoading, showSuccess, showError } = useLoading()

  const fetchData = useCallback(
    async <T,>(url: string, options: ApiOptions = {}): Promise<T | null> => {
      const {
        showLoading = true,
        loadingMessage = "Loading...",
        successMessage,
        errorMessage = "An error occurred",
        ...fetchOptions
      } = options

      try {
        if (showLoading) {
          startLoading(loadingMessage)
        }

        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          let errorData
          try {
            errorData = await response.json()
          } catch (e) {
            errorData = { message: `Error ${response.status}: ${response.statusText}` }
          }
          throw new Error(errorData.message || errorMessage)
        }

        const result = await response.json()
        setData(result)

        if (successMessage) {
          showSuccess(successMessage)
        } else {
          stopLoading()
        }

        return result as T
      } catch (err: any) {
        setError(err)
        showError(err.message || errorMessage)
        return null
      }
    },
    [startLoading, stopLoading, showSuccess, showError],
  )

  return {
    data,
    error,
    isLoading: false, // The loading state is now managed by the LoadingProvider
    fetchData,
  }
}
