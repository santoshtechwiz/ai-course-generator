"use client";

import { ProgressProvider } from '@bprogress/next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { initializeStorageSystem } from '@/lib/storage/startup-service';
import { toast } from '@/components/ui/use-toast';

const Providers = ({ children }: { children: ReactNode }) => {
  // Initialize storage system with migration and cleanup
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Initialize storage system
        await initializeStorageSystem()
        console.log('Storage system initialized successfully')
      } catch (error) {
        console.error('Storage initialization failed:', error)
        toast({
          title: 'Storage System Error',
          description: 'Failed to initialize the storage system. Please refresh the page.',
          variant: 'destructive',
        })
      }
    }

    // Run initialization
    initStorage()
  }, [])

  // Create a QueryClient instance
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors
            if (error && typeof error === 'object' && 'status' in error) {
              const status = (error as any).status
              if (typeof status === 'number' && status >= 400 && status < 500) {
                return false
              }
            }
            return failureCount < 3
          },
        },
        mutations: {
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors
            if (error && typeof error === 'object' && 'status' in error) {
              const status = (error as any).status
              if (typeof status === 'number' && status >= 400 && status < 500) {
                return false
              }
            }
            return failureCount < 2
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProgressProvider
        height="4px"
        color="#0066cc"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {children}
      </ProgressProvider>
    </QueryClientProvider>
  );
};

export default Providers;
