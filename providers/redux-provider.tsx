"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { store, persistor } from "@/store"

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  const [persistError, setPersistError] = useState<Error | null>(null)

  // Only render PersistGate on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Add error handling for redux-persist
  useEffect(() => {
    const handlePersistorError = (error: Error) => {
      console.error("Redux persistor error:", error)
      setPersistError(error)

      // Try to recover by purging the persisted state
      persistor.purge().then(() => {
        console.log("Purged persisted state due to error")
        window.location.reload()
      })
    }

    // Add error listener
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason?.message?.includes("persist")) {
        handlePersistorError(event.reason)
      }
    })

    return () => {
      window.removeEventListener("unhandledrejection", () => {})
    }
  }, [])

  // Show error UI if persist fails
  if (persistError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="mb-4">There was a problem loading your saved data. The application has been reset.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Application
          </button>
        </div>
      </div>
    )
  }

  return (
    <Provider store={store}>
      {isClient ? (
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      ) : (
        children
      )}
    </Provider>
  )
}
