"use client"

import { Provider } from 'react-redux'
import { store } from './index'
import { ReactNode } from 'react'
import { subscriptionErrorHandler } from '@/lib/subscription-error-handler';
import { AuthProvider } from "@/context/auth-context"

// Initialize the subscription error handler early
subscriptionErrorHandler.initialize();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  )
}
