"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoader } from "./loader-context";
import type { LoaderProps } from "./types";

interface NavigationLoaderOptions {
  enabled?: boolean;
  showProgress?: boolean;
  variant?: LoaderProps["variant"];
  message?: string;
  fullscreen?: boolean;
}

/**
 * A hook that handles showing a loader during navigation events.
 * This is a wrapper around the useLoader hook specifically for navigation.
 */
export function useNavigationLoader(options?: NavigationLoaderOptions) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showLoader, hideLoader, updateLoader } = useLoader();

  // Default options for navigation loading
  const {
    enabled = true,
    showProgress = false,
    variant = "clip",
    message = "Loading...",
    fullscreen = true,
  } = options || {};

  // Track path changes to show loading indicator
  useEffect(() => {
    if (!enabled) return;
    
    // Show loading indicator for navigation
    const handleStart = () => {
      setIsNavigating(true);
      showLoader({
        variant,
        message,
        showProgress,
        fullscreen,
      });
      
      // Add a class to body for potential global styling
      if (typeof document !== "undefined") {
        document.body.classList.add("navigation-in-progress");
      }
    };
    
    // Hide loading indicator when navigation is complete
    const handleStop = () => {
      setIsNavigating(false);
      hideLoader();
      
      if (typeof document !== "undefined") {
        document.body.classList.remove("navigation-in-progress");
      }
    };

    // Start the navigation indicator
    handleStart();

    // Set a short timeout to ensure the navigation indicator is shown
    // This simulates a minimum showing time
    const timeout = setTimeout(() => {
      handleStop();
    }, 500);

    return () => {
      clearTimeout(timeout);
      handleStop();
    };
  }, [pathname, searchParams, enabled, showProgress, variant, message, fullscreen, showLoader, hideLoader]);

  return {
    isNavigating,
    
    // Manually control the loader
    startNavigationLoader: (customOptions?: Partial<LoaderProps>) => {
      setIsNavigating(true);
      showLoader({
        variant,
        message,
        showProgress,
        fullscreen,
        ...customOptions,
      });
    },
    
    // Manually stop the loader
    stopNavigationLoader: () => {
      setIsNavigating(false);
      hideLoader();
    },
    
    // Update loader during navigation
    updateNavigationLoader: updateLoader,
  };
}
