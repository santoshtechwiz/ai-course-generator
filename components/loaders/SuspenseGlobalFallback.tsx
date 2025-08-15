"use client";
import { useGlobalLoader } from "@/store/loaders/global-loader";
import { useEffect } from "react";

/**
 * Suspense fallback that triggers the global loader (blocking) and returns null.
 * Ensures only one loader is shown globally with proper accessibility support.
 */
export default function SuspenseGlobalFallback({ message = "Loading content..." }: { message?: string }) {
  const { startLoading, stopLoading } = useGlobalLoader();

  useEffect(() => {
    startLoading({ 
      message, 
      isBlocking: true,
      autoProgress: true,
      deterministic: true, // Use deterministic progress
      minVisibleMs: 500, // Ensure minimum visibility
    });
    return () => stopLoading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return a proper loading indicator for screen readers while the global loader handles visuals
  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-label={message || "Loading content, please wait"}
      className="sr-only"
    >
      {message || "Loading..."}
    </div>
  );
}
