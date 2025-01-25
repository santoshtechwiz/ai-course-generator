import { useState, useEffect } from "react"

let apiRequestsInProgress = 0

export function useApiLoading() {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      apiRequestsInProgress++
      setIsLoading(true)
      try {
        const response = await originalFetch(...args)
        return response
      } finally {
        apiRequestsInProgress--
        if (apiRequestsInProgress === 0) {
          setIsLoading(false)
        }
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return isLoading
}

