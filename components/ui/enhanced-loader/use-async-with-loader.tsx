"use client";

import { useCallback } from 'react';
import { useEnhancedLoader } from './enhanced-loader-provider';
import type { EnhancedLoaderProps } from './enhanced-loader';

/**
 * A hook that provides functionality for handling async operations with the enhanced loader.
 */
export function useAsyncWithLoader() {
  const { showLoader, hideLoader, updateLoader } = useEnhancedLoader();

  /**
   * Wraps an async function with loader handling.
   * Shows the loader before the function starts and hides it after completion.
   * 
   * @param asyncFn The async function to wrap
   * @param options Loader options
   * @returns A wrapped function that shows/hides the loader
   */
  const withLoader = useCallback(
    <T extends any[], R>(
      asyncFn: (...args: T) => Promise<R>,
      options: Partial<EnhancedLoaderProps> = {}
    ) => {
      return async (...args: T): Promise<R> => {
        try {
          // Show the loader with default options
          showLoader({
            variant: "shimmer",
            message: "Loading...",
            fullscreen: true,
            ...options
          });
          
          // Execute the async function
          const result = await asyncFn(...args);
          
          // Hide the loader after a short delay for better UX
          setTimeout(() => {
            hideLoader();
          }, 300);
          
          return result;
        } catch (error) {
          // Hide the loader on error
          hideLoader();
          throw error;
        }
      };
    },
    [showLoader, hideLoader]
  );

  /**
   * Updates loader progress during a long-running operation.
   * Useful for providing progress feedback to users.
   * 
   * @param progress Progress value (0-100)
   * @param message Optional message to update
   */
  const updateProgress = useCallback(
    (progress: number, message?: string) => {
      updateLoader({ 
        progress, 
        ...(message ? { message } : {}) 
      });
    },
    [updateLoader]
  );

  return {
    withLoader,
    updateProgress
  };
}

export default useAsyncWithLoader;
