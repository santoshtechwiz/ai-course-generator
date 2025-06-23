"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoaderComponent } from "./loader";
import type { LoaderProps } from "./types";

interface LoaderContextType {
  showLoader: (options?: Partial<LoaderProps>) => void;
  hideLoader: () => void;
  updateLoader: (options: Partial<LoaderProps>) => void;
  isLoading: boolean;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
}

interface LoaderProviderProps {
  children: React.ReactNode;
  defaultOptions?: Partial<LoaderProps>;
}

export function LoaderProvider({
  children,
  defaultOptions = {},
}: LoaderProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<Partial<LoaderProps>>({
    message: "Loading...",
    variant: "clip",
    fullscreen: true,
    showLogo: true,
    ...defaultOptions,
  });

  const showLoader = useCallback((newOptions?: Partial<LoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...(newOptions || {}) }));
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    // Graceful exit with a short timeout
    setTimeout(() => setIsLoading(false), 200);
  }, []);

  const updateLoader = useCallback((newOptions: Partial<LoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  // Track path changes
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Show loader on route change
    showLoader();

    const minVisibleDuration = 400;
    const startTime = Date.now();

    // Hide loader after minimum duration
    timeoutId = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, minVisibleDuration - elapsed);
      setTimeout(hideLoader, delay);
    }, 50); // render latency buffer

    return () => clearTimeout(timeoutId);
  }, [pathname, showLoader, hideLoader]);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, isLoading }}>
      {children}
      <LoaderComponent isLoading={isLoading} {...options} />
    </LoaderContext.Provider>
  );
}
