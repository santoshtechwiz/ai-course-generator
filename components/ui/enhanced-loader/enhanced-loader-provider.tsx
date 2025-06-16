"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { EnhancedLoader, type EnhancedLoaderProps } from "./enhanced-loader";

interface EnhancedLoaderContextType {
  showLoader: (options?: Partial<EnhancedLoaderProps>) => void;
  hideLoader: () => void;
  updateLoader: (options: Partial<EnhancedLoaderProps>) => void;
  isLoading: boolean;
}

const EnhancedLoaderContext = createContext<EnhancedLoaderContextType | undefined>(undefined);

export function useEnhancedLoader() {
  const context = useContext(EnhancedLoaderContext);
  if (!context) {
    throw new Error("useEnhancedLoader must be used within an EnhancedLoaderProvider");
  }
  return context;
}

interface EnhancedLoaderProviderProps {
  children: React.ReactNode;
  defaultOptions?: Partial<EnhancedLoaderProps>;
}

export function EnhancedLoaderProvider({
  children,
  defaultOptions = {},
}: EnhancedLoaderProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<Partial<EnhancedLoaderProps>>({
    message: "Loading...",
    variant: "shimmer",
    fullscreen: true,
    ...defaultOptions,
  });

  const showLoader = useCallback((newOptions?: Partial<EnhancedLoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...(newOptions || {}) }));
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const updateLoader = useCallback((newOptions: Partial<EnhancedLoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  return (
    <EnhancedLoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, isLoading }}>
      {children}
      <EnhancedLoader isLoading={isLoading} {...options} />
    </EnhancedLoaderContext.Provider>
  );
}
