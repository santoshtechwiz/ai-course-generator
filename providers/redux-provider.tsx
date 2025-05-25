"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Provider } from "react-redux"
import { store } from "@/store"

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Add client-side only logic to handle persist gate
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <Provider store={store}>
    
       
        {children}
     
    </Provider>
  )
}
