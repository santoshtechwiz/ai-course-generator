"use client"

import { Provider } from 'react-redux'
import { store } from './index'
import { ReactNode } from 'react'
import { AppProviders } from "@/providers/AppProviders"

export function Providers({ children, session }: { children: ReactNode; session?: any }) {
  return (
    <Provider store={store}>
      <AppProviders session={session}>
        {children}
      </AppProviders>
    </Provider>
  )
}
