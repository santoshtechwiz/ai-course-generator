"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"
import { AnimationProvider } from "./animation-provider"
import { ReduxProvider } from "./redux-provider"
import { SubscriptionProvider } from "@/store/subscription-provider"
import { SessionProvider } from "./session-provider"
import MainNavbar from "@/components/layout/navigation/MainNavbar"
import TrialModal from "@/components/features/subscription/TrialModal"
import { JsonLd } from "@/app/schema/components/json-ld"

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
          session={session}
         
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            <SubscriptionProvider>
              <AnimationProvider>
                <MainNavbar />
                <Suspense fallback={<div>Loading...</div>}>
                  <TrialModal />
                </Suspense>
                <JsonLd type="default" />
                <Toaster position="top-right" closeButton richColors />
                {mounted && children}
              </AnimationProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </SessionProvider>
      </ReduxProvider>
    </QueryClientProvider>
  )
}
