"use client";

import { useNavigationLoader } from "./use-navigation-loader";

/**
 * This component can be placed in a layout to automatically show the loader
 * during navigation and provide a global way to handle loading states.
 * 
 * Usage:
 * 1. Add to a layout: <GlobalLoadingHandler />
 * 2. Use the exposed hook in components: 
 *    const { showLoader, hideLoader } = useLoader();
 */
export function GlobalLoadingHandler() {
  // Set up navigation loading
  useNavigationLoader({
    enabled: true,
    variant: "clip",
    fullscreen: true,
    message: "Loading page...",
  });
  
  // For demonstration: You can also use this component to initialize other loading patterns
  // For example, you could set up API request interceptors here to show loading on all API calls
  
  // Return null as this is just a hook wrapper
  return null;
}
