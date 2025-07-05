"use client"

import { Provider } from 'react-redux'
import { store } from './index'
import { ReactNode } from 'react'
import { subscriptionErrorHandler } from '@/lib/subscription-error-handler'
import { AppProviders } from "@/providers/AppProviders"

// Initialize the subscription error handler early
subscriptionErrorHandler.initialize();

export function Providers({ children, session }: { children: ReactNode; session?: any }) {
  return (
    <Provider store={store}>
      <AppProviders session={session}>
        {children}
      </AppProviders>
    </Provider>
  )
}
