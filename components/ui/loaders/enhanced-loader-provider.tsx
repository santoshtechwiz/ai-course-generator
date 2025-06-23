"use client";

// Import directly from the module file to avoid path resolution issues
import { LoaderProvider, useLoader } from '@/components/ui/loader/loader-context';

// Re-export with old names for compatibility
export { LoaderProvider as EnhancedLoaderProvider, useLoader as useEnhancedLoader };
