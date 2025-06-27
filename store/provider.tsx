"use client"

import { Provider } from 'react-redux'
import { store } from './index'
import { ReactNode } from 'react'
import { subscriptionErrorHandler } from '@/lib/subscription-error-handler'
import { EnhancedAuthProvider } from "@/providers/enhanced-auth-provider"

// Initialize the subscription error handler early
subscriptionErrorHandler.initialize();

export function Providers({ children, session }: { children: ReactNode; session?: any }) {
  return (
    <Provider store={store}>
      {/* Use our new EnhancedAuthProvider instead of the old AuthProvider */}
      <EnhancedAuthProvider session={session}>
        {children}
      </EnhancedAuthProvider>
    </Provider>
  )
}
