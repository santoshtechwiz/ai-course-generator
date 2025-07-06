"use client"

import { useEffect, useState } from 'react'

interface NoSSRProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * NoSSR - Client-only wrapper to prevent hydration mismatches
 * 
 * This component ensures that its children are only rendered on the client,
 * preventing hydration mismatches for components with dynamic content.
 * 
 * Use this for:
 * - Components with animations that start immediately
 * - Components using Math.random() or Date.now()
 * - Components that depend on browser APIs
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default NoSSR
