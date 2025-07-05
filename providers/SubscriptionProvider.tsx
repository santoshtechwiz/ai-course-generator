"use client"

import type React from "react"

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  // This provider is now just a compatibility layer
  // All auth logic is handled by AuthProvider from @/modules/auth
  return <>{children}</>
}

export default SubscriptionProvider
