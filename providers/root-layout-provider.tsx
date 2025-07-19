"use client";




import React, { Suspense, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Suspense, useState, useEffect } from "react";
import { AnimationProvider } from "./animation-provider";
import { SEOTrackingProvider } from "@/providers/seo-tracking-provider";
import SubscriptionProvider from "./SubscriptionProvider";
import { AppProviders } from "./AppProviders";
// Removed duplicate loader imports
import { TooltipProvider } from "@/components/ui/tooltip";
import MainNavbar from "@/components/layout/navigation/MainNavbar";
import Footer from "@/components/shared/Footer";

// MainNavbar and Footer heights (adjust if needed)
const NAVBAR_HEIGHT = 64; // px
const FOOTER_HEIGHT = 56; // px

interface AppLayoutShellProps {
  children: React.ReactNode;
  session?: any;
}

export function AppLayoutShell({ children, session }: AppLayoutShellProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Example usage in async actions:
  // const { withLoading } = useGlobalLoader()
  // await withLoading(apiCall())

  return (
    <React.StrictMode>
      <Provider store={store}>
  
        <PersistGate loading={null} persistor={persistor}>
          <AppProviders session={session}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem={true}
              disableTransitionOnChange
              // Add these props to fix hydration issues
              storageKey="course-ai-theme"
              enableColorScheme={true}
            >
              <SEOTrackingProvider>
                <QueryClientProvider client={queryClient}>
                  <TooltipProvider>
                    <SubscriptionProvider>
                      <AnimationProvider>
                        <div className="min-h-screen flex flex-col font-body bg-background text-foreground">
                          <MainNavbar />
                          {/* Main content area with global padding for navbar/footer */}
                          <main
                            className="flex-1 flex flex-col"
                            style={{
                              paddingTop: `${NAVBAR_HEIGHT}px`,
                              paddingBottom: `${FOOTER_HEIGHT}px`,
                              minHeight: `calc(100vh - ${NAVBAR_HEIGHT + FOOTER_HEIGHT}px)`
                            }}
                          >
                            <Suspense fallback={<></>}>
                              <Toaster position="top-right" closeButton richColors />
                              {mounted && children}
                            </Suspense>
                          </main>
                          {/* If Footer does not accept className/style, remove these props below and just use <Footer /> */}
                          <div style={{ height: `${FOOTER_HEIGHT}px` }} className="fixed left-0 right-0 bottom-0 z-30">
                            <Footer />
                          </div>
                        </div>
                      </AnimationProvider>
                    </SubscriptionProvider>
                  </TooltipProvider>
                </QueryClientProvider>
              </SEOTrackingProvider>
            </ThemeProvider>
          </AppProviders>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );

}

export default RootLayoutProvider;
