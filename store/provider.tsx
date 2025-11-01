"use client"

import { Provider } from 'react-redux'
import { store, persistor } from './index'
import { PersistGate } from 'redux-persist/integration/react'
import { ReactNode } from 'react'
import { AppProviders } from "@/providers/AppProviders"

export function Providers({ children, session }: { children: ReactNode; session?: any }) {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Loading your progress...</p>
            </div>
          </div>
        } 
        persistor={persistor}
      >
        <AppProviders session={session}>
          {children}
        </AppProviders>
      </PersistGate>
    </Provider>
  )
}

