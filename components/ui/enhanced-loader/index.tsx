"use client";

// Import directly from the module files to avoid path resolution issues
import { LoaderComponent as Loader } from "@/components/ui/loader/loader";
import { LoaderProvider, useLoader } from "@/components/ui/loader/loader-context";
import { AsyncNavLink } from "@/components/ui/loader/async-nav-link";
import { useAsyncWithLoader } from "@/components/ui/loader/use-async-with-loader";
import { GlobalLoadingHandler } from "@/components/ui/loader/global-loading-handler";
import type { LoaderProps } from "@/components/ui/loader/types";

// Re-export with legacy names for backward compatibility
export {
  Loader as EnhancedLoader,
  LoaderProvider as EnhancedLoaderProvider,
  useLoader as useEnhancedLoader,
  AsyncNavLink,
  useAsyncWithLoader,
  GlobalLoadingHandler,
};

export type { LoaderProps as EnhancedLoaderProps };
