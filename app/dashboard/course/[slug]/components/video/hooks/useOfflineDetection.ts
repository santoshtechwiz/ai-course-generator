"use client";

import { useState, useEffect, useRef } from "react";

interface OfflineDetectionOptions {
  onOffline?: () => void;
  onOnline?: () => void;
}

export function useOfflineDetection({ onOffline, onOnline }: OfflineDetectionOptions = {}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [onOffline, onOnline]);

  return { isOnline, isOffline: !isOnline };
}
