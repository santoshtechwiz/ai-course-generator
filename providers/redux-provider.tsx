"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { Loader2 } from "lucide-react"
import { store, persistor } from "@/store"

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Add client-side only logic to handle persist gate
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <Provider store={store}>
      {isClient ? (
        <PersistGate 
          loading={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          } 
          persistor={persistor}
        >
          {children}
        </PersistGate>
      ) : (
        children
      )}
    </Provider>
  )
}
