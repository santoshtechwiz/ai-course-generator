"use client";
import { useGlobalLoader } from "@/store/loaders/global-loader";
import { useEffect } from "react";


/**
 * Suspense fallback that triggers the global loader (blocking) and returns null.
 * Ensures only one loader is shown globally with proper accessibility support.
 */
export default function SuspenseGlobalFallback({ message = "Loading content..." }: { message?: string }) {
  const { startLoading, stopLoading } = useGlobalLoader();
  // Prevent double-stops and provide a stable reference
  const stoppedRef = { current: false } as { current: boolean }

  useEffect(() => {
    try {
      startLoading({
        message,
        isBlocking: true,
        minVisibleMs: 120
      });
    } catch (e) {
      // ignore if store isn't available yet
    }

    // Safety: ensure loader does not remain permanently if the Suspense child
    // never resolves (network issues, client bundle failure, etc.). Shorter
    // timeout reduces stuck UI while still allowing slow responses.
    const safetyTimeout = setTimeout(() => {
      if (!stoppedRef.current) {
        console.warn("SuspenseGlobalFallback: safety timeout reached, stopping global loader to avoid stuck state.")
        try { stopLoading() } catch (e) { /* ignore */ }
        stoppedRef.current = true
      }
    }, 12000);

    return () => {
      clearTimeout(safetyTimeout);
      if (!stoppedRef.current) {
        try { stopLoading() } catch (e) { /* ignore */ }
        stoppedRef.current = true
      }
    };
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
