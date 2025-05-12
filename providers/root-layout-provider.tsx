"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Suspense, useState, useEffect } from "react"
import { AnimationProvider } from "./animation-provider"
import { ReduxProvider } from "./redux-provider"

import { SessionProvider } from "next-auth/react"
import MainNavbar from "@/components/layout/navigation/MainNavbar"
import TrialModal from "@/components/features/subscription/TrialModal"
import { JsonLd } from "@/app/schema/components/json-ld"
import SubscriptionProvider from "./SubscriptionProvider"
import { SessionSync } from "./session-provider"
import { LoadingProvider } from "@/components/ui/loading/loading-provider"

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

  return (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider>
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            <SubscriptionProvider>
               <LoadingProvider>
              <AnimationProvider>
                <SessionSync />
                <MainNavbar />
                <Suspense fallback={<div>Loading...</div>}>
                  <TrialModal />
                </Suspense>
                <JsonLd type="default" />
                <Toaster position="top-right" closeButton richColors />
                {mounted && children}
              </AnimationProvider>
              </LoadingProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </SessionProvider>
      </ReduxProvider>
    </QueryClientProvider>
  )
}
