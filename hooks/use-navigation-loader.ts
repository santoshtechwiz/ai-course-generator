"use client";

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEnhancedLoader } from '@/components/ui/enhanced-loader';

export function useNavigationLoader(options?: {
  enabled?: boolean;
  showProgress?: boolean;
  variant?: 'shimmer' | 'pulse' | 'dots' | 'glow' | 'progress';
  message?: string;
  fullscreen?: boolean;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showLoader, hideLoader, updateLoader } = useEnhancedLoader();

  // Default options for navigation loading
  const {
    enabled = true,
    showProgress = false,
    variant = 'shimmer',
    message = 'Loading...',
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
      
      // Add a class to the body to indicate navigation is in progress
      document.body.classList.add('navigation-in-progress');
    };

    // Hide loading indicator when navigation is complete
    const handleStop = () => {
      setIsNavigating(false);
      hideLoader();
      document.body.classList.remove('navigation-in-progress');
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
    startNavigationLoader: (customOptions?: any) => {
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

export default useNavigationLoader;
