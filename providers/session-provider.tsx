"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

/**
 * Centralized session provider component
 * Use this to wrap components needing session access without duplicating SessionProvider
 */
export function SessionProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode
  session: Session | null | undefined
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}

export default SessionProvider
