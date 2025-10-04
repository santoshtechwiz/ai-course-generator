'use client'

import { ReactNode, useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/modules/auth'
import { SubscriptionProvider } from '@/modules/subscription'
import { AnimationProvider } from './animation-provider'
import { StorageMigrator } from '@/utils/storage-migrator'

interface AppProvidersProps {
  children: ReactNode
  session?: any
}

/**
 * AppProviders - Root provider stack for the application
 * 
 * Provider order (outer to inner):
 * 1. SessionProvider - NextAuth session management
 * 2. QueryClientProvider - React Query for data fetching
 * 3. AuthProvider - Authentication state (session-based)
 * 4. SubscriptionProvider - Subscription state (credits, plan, etc.)
 * 5. AnimationProvider - Animation utilities
 * 6. ThemeProvider - Dark/light mode
 */
export function AppProviders({ children, session }: AppProvidersProps) {
  // Create QueryClient instance - using useState to ensure it's stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  // Run storage migration on app initialization
  useEffect(() => {
    StorageMigrator.migrateAllData()
  }, [])

  return (
    <SessionProvider
      session={session}
      refetchInterval={0} // Disable automatic background refetch - only refresh on demand
      refetchOnWindowFocus={false} // Don't refetch on window focus
      refetchWhenOffline={false} // Don't refetch when coming back online
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <AnimationProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
                <Toaster />
              </ThemeProvider>
            </AnimationProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
