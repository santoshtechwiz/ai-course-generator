"use client"


import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect, useMemo } from "react"
import { AnimationProvider } from "./animation-provider"
import { ReduxProvider } from "./redux-provider"

import { SessionProvider } from "next-auth/react"
import MainNavbar from "@/components/layout/navigation/MainNavbar"
import { JsonLd } from "@/app/schema/components/json-ld"
import SubscriptionProvider from "./SubscriptionProvider"
import { SessionSync } from "./session-provider"
import { LoadingProvider } from "@/components/ui/loading/loading-provider"

import { TooltipProvider } from "@/components/ui/tooltip"
import React from "react"

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

  // Memoize the navbar to prevent unnecessary re-renders
  const navbar = useMemo(() => <MainNavbar />, [])

  // Memoize more components that don't need to re-render frequently
  const jsonLd = useMemo(() => <JsonLd type="default" />, [])
  const sessionSync = useMemo(() => <SessionSync />, [])

  return (
    <React.StrictMode>
      <SessionProvider session={session}>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
            // Add these props to fix hydration issues
            storageKey="course-ai-theme"
            enableColorScheme={true}
          >
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <SubscriptionProvider>
                  <LoadingProvider>
                    <AnimationProvider>
                      {sessionSync}
                      {navbar}
                      <Suspense fallback={<div>Loading...</div>}></Suspense>
                      {jsonLd}
                      <Toaster position="top-right" closeButton richColors />
                      {mounted && children}
                    </AnimationProvider>
                  </LoadingProvider>
                </SubscriptionProvider>
              </TooltipProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </ReduxProvider>
      </SessionProvider>
    </React.StrictMode>
  )
}
