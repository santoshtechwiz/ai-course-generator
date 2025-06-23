"use client";

// This file re-exports components from the new location to ensure backward compatibility
export { 
  Loader as EnhancedLoader,
  LoaderProvider as EnhancedLoaderProvider,
  useLoader as useEnhancedLoader,
  AsyncNavLink,
  useAsyncWithLoader,
  GlobalLoadingHandler
} from "@/components/ui/loader-new";

// Type re-exports
export type { LoaderProps as EnhancedLoaderProps } from "@/components/ui/loader-new";
