"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { GlobalSubscriptionSynchronizer } from "@/components/GlobalSubscriptionSynchronizer";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  // This effect ensures that the DOM is fully loaded before animations run
  useEffect(() => {
    // Add a class to indicate that the page is loaded
    // This prevents layout shifts during initial render
    document.documentElement.classList.add('page-loaded');
    
    // Clean up function
    return () => {
      document.documentElement.classList.remove('page-loaded');
    };
  }, []);

  return (
    <div className="client-layout-wrapper">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false} // Enable smooth transitions between themes
      >
        <GlobalSubscriptionSynchronizer />
        {children}
      </ThemeProvider>
    </div>
  );
}

export default ClientLayoutWrapper;
