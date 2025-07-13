"use client";
import { useEffect } from "react";
import { useGlobalLoader } from "@/store/global-loader";

/**
 * Suspense fallback that triggers the global loader (blocking) and returns null.
 * Ensures only one loader is shown globally.
 */
export default function SuspenseGlobalFallback({ message = "" }: { message?: string }) {
  const { startLoading, stopLoading } = useGlobalLoader();

  useEffect(() => {
    startLoading({ message, isBlocking: true });
    return () => stopLoading();
    // eslint-disable-next-line
  }, []);

  return null;
}
