'use client'

import { ReactNode, useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/modules/auth'
import { SubscriptionProvider } from '@/modules/subscription'
import { AnimationProvider } from './animation-provider'
import { ClientGuestProvider } from '@/components/guest/ClientGuestProvider'
import { storage, migrateStorageData, performStorageCleanup, validateStorageMigration } from '@/lib/storage'

interface AppProvidersProps {
  children: ReactNode
  session?: any
}

/**
 * ✅ Optimized Provider Order (outer → inner)
 *
 * 1️⃣ SessionProvider       → NextAuth global session context
 * 2️⃣ QueryClientProvider   → React Query for data caching/fetching
 * 3️⃣ AuthProvider          → App-level auth state derived from session
 * 4️⃣ SubscriptionProvider  → Business logic (plan, credits, billing)
 * 5️⃣ ThemeProvider         → Dark/light theme
 * 6️⃣ AnimationProvider     → Animation utilities
 * 7️⃣ Toaster               → Notifications
 */
export function AppProviders({ children, session }: AppProvidersProps) {
  // Initialize unified storage system
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Run storage migration
    const migrationResults = migrateStorageData();
    if (migrationResults.errors.length > 0) {
      console.warn('Storage migration errors:', migrationResults.errors);
    }

    // Run storage cleanup
    const cleanupResults = performStorageCleanup();
    if (cleanupResults.errors.length > 0) {
      console.warn('Storage cleanup errors:', cleanupResults.errors);
    }

    // Validate migration
    const validationResults = validateStorageMigration();
    if (!validationResults.valid) {
      console.warn('Storage validation issues:', validationResults.issues);
      console.log('Storage recommendations:', validationResults.recommendations);
    }
  }, []);

  // Stable QueryClient across renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevent React Query from retrying on AbortError
            retry: (failureCount, error: any) => {
              if (error?.name === "AbortError") return false
              return failureCount < 2
          },
          throwOnError: (error: any) => {
            // Only throw real errors, not aborts
            if (error?.name === "AbortError") return false
            return true
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000,   // Garbage collection
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: (failureCount, error: any) => {
            if (error?.name === "AbortError") return false
            return failureCount < 1
          },
          throwOnError: (error: any) => {
            if (error?.name === "AbortError") return false
            return true
          },
        },
      }
    })
)

  // Migrate storage only once at startup
  useEffect(() => {
    // Initialize the unified storage system
    import('@/lib/storage/startup-service').then(({ initializeStorageSystem }) => {
      initializeStorageSystem().catch(error => {
        console.error('Storage system initialization failed:', error)
      })
    })
  }, [])

  // Handle unhandled promise rejections (especially AbortErrors)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const isAbortError = error?.name === 'AbortError' ||
                          error?.message?.includes('signal is aborted') ||
                          error?.message?.includes('aborted without reason')

      if (isAbortError) {
        // Prevent AbortErrors from showing up in console as unhandled rejections
        console.info('ℹ️ Unhandled AbortError caught:', error.message)
        event.preventDefault()
      }
    }

    const handleError = (event: ErrorEvent) => {
      const isAbortError = event.error?.name === 'AbortError' ||
                          event.message?.includes('signal is aborted') ||
                          event.message?.includes('aborted without reason')

      if (isAbortError) {
        console.info('ℹ️ Global AbortError caught:', event.error?.message || event.message)
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AnimationProvider>
                <ClientGuestProvider>
                  {children}
                  <Toaster />
                </ClientGuestProvider>
              </AnimationProvider>
            </ThemeProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
