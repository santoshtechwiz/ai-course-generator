"use client";

import { ProgressProvider } from '@bprogress/next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

const Providers = ({ children }: { children: ReactNode }) => {
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
