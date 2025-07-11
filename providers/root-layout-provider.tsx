"use client"


import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"
import { AnimationProvider } from "./animation-provider"
import { SEOTrackingProvider } from "@/providers/seo-tracking-provider"
import SubscriptionProvider from "./SubscriptionProvider"
import { AppProviders } from "./AppProviders"
// Removed duplicate loader imports
import { TooltipProvider } from "@/components/ui/tooltip"
import React from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { store, persistor } from "@/store"
import { Loader } from "../components/ui/loader"

// Create a query client with optimized settings
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

interface RootLayoutProviderProps {
  children: React.ReactNode
  session: any
}

export function RootLayoutProvider({ children, session }: RootLayoutProviderProps) {
  // Create QueryClient with proper initialization
  const [queryClient] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <React.StrictMode>
      <Provider store={store}>        <PersistGate loading={null} persistor={persistor}>
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
                        <Suspense fallback={<Loader context="loading" className="w-8 h-8 mx-auto mt-10" />}>
                          <Toaster position="top-right" closeButton richColors />
                          {mounted && children}
                        </Suspense>
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
  )
}

export default RootLayoutProvider
