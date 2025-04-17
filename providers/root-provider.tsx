"use client"

import type * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider, type SessionProviderProps } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"
import { UnifiedAuthProvider } from "./unified-auth-provider"
import TrialModal from "@/components/TrialModal"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { AnimationProvider } from "./animation-provider"

// Create a query client with optimized settings
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

interface RootProviderProps extends Omit<SessionProviderProps, "children"> {
  children: React.ReactNode
}

export function RootProvider({ children, session, ...props }: RootProviderProps) {
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
        <AnimationProvider>
        <UnifiedAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            {mounted && (
              <Suspense fallback={null}>
                <SubscriptionStatus />
              </Suspense>
            )}
            <Toaster position="top-right" closeButton richColors />
            {children}
          </ThemeProvider>
        </UnifiedAuthProvider>
        </AnimationProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

// Extract subscription status logic into a separate component
function SubscriptionStatus() {
  const { subscriptionStatus } = useSubscriptionStore()

  const isSubscribed = subscriptionStatus?.isActive || false
  const currentPlan = subscriptionStatus?.subscriptionPlan || null

  return <TrialModal isSubscribed={isSubscribed} currentPlan={currentPlan} user={null} />
}
