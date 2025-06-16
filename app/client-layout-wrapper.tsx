"use client";

import { GlobalLoadingHandler, EnhancedLoaderProvider } from "@/components/ui/enhanced-loader";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <EnhancedLoaderProvider defaultOptions={{ variant: "shimmer", fullscreen: true }}>
      <GlobalLoadingHandler />
      {children}
    </EnhancedLoaderProvider>
  );
}

export default ClientLayoutWrapper;
