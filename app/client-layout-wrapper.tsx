"use client";

// Import from the enhanced-loader for backward compatibility
// This ensures we're using the same instances of components that other parts of the app use
import { EnhancedLoaderProvider, GlobalLoadingHandler } from "@/components/ui/enhanced-loader";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <EnhancedLoaderProvider defaultOptions={{ variant: "pulse", fullscreen: true }}>
      <GlobalLoadingHandler />
      {children}
    </EnhancedLoaderProvider>
  );
}

export default ClientLayoutWrapper;
