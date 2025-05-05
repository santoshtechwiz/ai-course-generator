"use client"

import type * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"

import { AnimationProvider } from "./animation-provider"
import { ReduxProvider } from "./redux-provider"
import { SubscriptionProvider } from "@/store/subscription-provider"
import { SessionProvider } from "./session-provider"
import type { SessionProviderProps } from "next-auth/react"

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

interface RootProviderProps extends Omit<SessionProviderProps, "children"> {
  children: React.ReactNode
}

export function RootProvider({ children, session, ...sessionProps }: RootProviderProps) {
  // Create QueryClient in a client component
  const [queryClient] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Session options
  const sessionOptions = {
    refetchInterval: 5 * 60, // 5 minutes in seconds
    refetchOnWindowFocus: false,
    refetchWhenOffline: false,
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider>
        <SessionProvider
        
          refetchInterval={sessionOptions.refetchInterval}
          refetchOnWindowFocus={sessionOptions.refetchOnWindowFocus}
          refetchWhenOffline={sessionOptions.refetchWhenOffline}
          {...sessionProps}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
         
              {/* SubscriptionProvider must come after SessionProvider */}
              <SubscriptionProvider>
                <AnimationProvider>
                  {mounted && <Suspense fallback={null}>{/* Subscription status component removed */}</Suspense>}
                  <Toaster position="top-right" closeButton richColors />
                  {children}
                </AnimationProvider>
              </SubscriptionProvider>
           
          </ThemeProvider>
        </SessionProvider>
      </ReduxProvider>
    </QueryClientProvider>
  )
}
