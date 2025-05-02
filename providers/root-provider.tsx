"use client"

import type * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider, type SessionProviderProps } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"
import { UnifiedAuthProvider } from "./unified-auth-provider"
import TrialModal from "@/components/TrialModal"

import { AnimationProvider } from "./animation-provider"

import { ReduxProvider } from "./redux-provider"
import { useSubscription } from "@/app/dashboard/subscription/hooks/use-subscription"
import { SubscriptionProvider } from "@/app/store/subscription-provider"

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

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
          <ReduxProvider>
            <SubscriptionProvider>
              <AnimationProvider>
                <UnifiedAuthProvider>
                  {mounted && (
                    <Suspense fallback={null}>
                      <SubscriptionStatus />
                    </Suspense>
                  )}
                  <Toaster position="top-right" closeButton richColors />
                  {children}
                </UnifiedAuthProvider>
              </AnimationProvider>
            </SubscriptionProvider>
          </ReduxProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

// Extract subscription status logic into a separate component
function SubscriptionStatus() {
  const { data, status } = useSubscription()
  const isLoading = status === "loading"

  // Only show trial modal if we have successfully loaded data
  if (isLoading || !data) {
    return null
  }

  const isSubscribed = data?.isSubscribed || false
  const currentPlan = data?.subscriptionPlan || null

  return <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />
}
