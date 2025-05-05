"use client"

import type * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider, type SessionProviderProps } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"
import { UnifiedAuthProvider } from "./unified-auth-provider"

import { AnimationProvider } from "./animation-provider"

import { ReduxProvider } from "./redux-provider"
import { SubscriptionProvider } from "@/store/subscription-provider"

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

export function RootProvider({ children, session }: RootProviderProps) {
  // Create QueryClient in a client component
  const [queryClient] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add a debounced session provider to reduce API calls
  const sessionOptions = {
    refetchInterval: 5 * 60, // 5 minutes in seconds
    refetchOnWindowFocus: false,
    refetchWhenOffline: false,
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        session={session}
        refetchInterval={sessionOptions.refetchInterval}
        refetchOnWindowFocus={sessionOptions.refetchOnWindowFocus}
      >
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            <UnifiedAuthProvider>
              <SubscriptionProvider>
                <AnimationProvider>
                  {mounted && <Suspense fallback={null}>{/* <SubscriptionStatus /> */}</Suspense>}
                  <Toaster position="top-right" closeButton richColors />
                  {children}
                </AnimationProvider>
              </SubscriptionProvider>
            </UnifiedAuthProvider>
          </ThemeProvider>
        </ReduxProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

// Extract subscription status logic into a separate component
// function SubscriptionStatus() {
//   const { subscription: data, fetchStatus: status } = useSubscription()
//   const isLoading = status === "fetching" ;

//   // Only show trial modal if we have successfully loaded data
//   if (isLoading || !data) {
//     return null
//   }

//   const isSubscribed = data?.isSubscribed || false
//   const currentPlan = data.currentPlan || null

//   return <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />
// }
