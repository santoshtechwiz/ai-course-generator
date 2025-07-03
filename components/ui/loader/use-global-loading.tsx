"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { GlobalLoaderProps } from "./global-loader"

type UseGlobalLoaderReturn = {
  /**
   * Whether content is currently loading
   */
  isLoading: boolean
  
  /**
   * Start the loading state with custom options
   */
  startLoading: (options?: Partial<GlobalLoaderProps>) => void
  
  /**
   * Stop the loading state
   */
  stopLoading: () => void
  
  /**
   * Update the current loading state options
   */
  updateLoading: (options: Partial<GlobalLoaderProps>) => void
  
  /**
   * Current loader options
   */
  loaderProps: GlobalLoaderProps
}

/**
 * Custom hook for managing loading state with the GlobalLoader
 * 
 * @param defaultOptions - Default options for the loader
 * @returns Loading state and control functions
 * 
 * @example
 * ```tsx
 * const { isLoading, startLoading, stopLoading, loaderProps } = useGlobalLoading({
 *   text: "Loading data...",
 *   theme: "primary"
 * });
 * 
 * // Start loading when fetching data
 * const fetchData = async () => {
 *   startLoading();
 *   try {
 *     await api.getData();
 *   } finally {
 *     stopLoading();
 *   }
 * }
 * ```
 */
export function useGlobalLoading(defaultOptions?: Partial<GlobalLoaderProps>): UseGlobalLoaderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [loaderProps, setLoaderProps] = useState<GlobalLoaderProps>({
    text: "Loading...",
    fullScreen: false,
    size: "md",
    variant: "spinner",
    theme: "primary",
    isLoading: false,
    ...defaultOptions,
  })
  
  const router = useRouter()
  
  // Start loading with optional custom options
  const startLoading = useCallback((options?: Partial<GlobalLoaderProps>) => {
    setLoaderProps(prev => ({ ...prev, ...(options || {}), isLoading: true }))
    setIsLoading(true)
  }, [])
  
  // Stop loading
  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setLoaderProps(prev => ({ ...prev, isLoading: false }))
  }, [])
  
  // Update loader options
  const updateLoading = useCallback((options: Partial<GlobalLoaderProps>) => {
    if (isLoading) {
      setLoaderProps(prev => ({ ...prev, ...options }))
    }
  }, [isLoading])
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    updateLoading,
    loaderProps: {
      ...loaderProps,
      isLoading,
    },
  }
}

export default useGlobalLoading
