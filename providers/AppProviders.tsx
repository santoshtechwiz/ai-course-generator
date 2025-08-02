"use client"

import { ReactNode, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/modules/auth'
import { AnimationProvider } from './animation-provider'
import GlobalLoaderProvider from '@/components/GlobalLoaderProvider'
import { useGlobalLoader } from "@/store/global-loader"

interface AppProvidersProps {
  children: ReactNode
  session?: any
}

export function AppProviders({ children, session }: AppProvidersProps) {
  // Create QueryClient instance - using useState to ensure it's stable across re-renders
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 1,
        },
      },
    })
  )

  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // 5 minutes instead of default 60 seconds
      refetchOnWindowFocus={false} // Don't refetch on every window focus
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AnimationProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <GlobalLoaderProvider>
                {children}
                <Toaster />
              </GlobalLoaderProvider>
            </ThemeProvider>
          </AnimationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

// Example usage in async actions:
// const { withLoading } = useGlobalLoader()
// await withLoading(apiCall())
