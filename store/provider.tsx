"use client"

import { Provider } from 'react-redux'
import { store } from './index'
import { ReactNode } from 'react'
import { subscriptionErrorHandler } from '@/lib/subscription-error-handler';

// Initialize the subscription error handler early
subscriptionErrorHandler.initialize();

export function Providers({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}
