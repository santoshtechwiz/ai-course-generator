"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { EnhancedLoader, type EnhancedLoaderProps } from "./enhanced-loader";
import { usePathname } from "next/navigation";

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
    variant: "dots",
    fullscreen: true,
    showLogo: true,
    ...defaultOptions,
  });

  const showLoader = useCallback((newOptions?: Partial<EnhancedLoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...(newOptions || {}) }));
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setTimeout(() => setIsLoading(false), 200); // graceful exit
  }, []);

  const updateLoader = useCallback((newOptions: Partial<EnhancedLoaderProps>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    showLoader();

    const minVisibleDuration = 400;
    const startTime = Date.now();

    timeoutId = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, minVisibleDuration - elapsed);
      setTimeout(hideLoader, delay);
    }, 50); // render latency

    return () => clearTimeout(timeoutId);
  }, [pathname, showLoader, hideLoader]);

  return (
    <EnhancedLoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, isLoading }}>
      {children}
      <EnhancedLoader isLoading={isLoading} {...options} />
    </EnhancedLoaderContext.Provider>
  );
}
