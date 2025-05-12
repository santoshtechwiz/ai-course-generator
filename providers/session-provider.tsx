"use client"

import type React from "react"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAppDispatch } from "@/store"
import { setUser, setIsAuthenticated } from "@/store/slices/authSlice"

// This component syncs the NextAuth session with our Redux store
function SessionSync() {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      dispatch(setUser(session.user))
      dispatch(setIsAuthenticated(true))
    } else if (status === "unauthenticated") {
      dispatch(setUser(null))
      dispatch(setIsAuthenticated(false))
    }
  }, [session, status, dispatch])

  return null
}

export function SessionProvider({ children, ...props }: React.ComponentProps<typeof NextAuthSessionProvider>) {
  return (
    <NextAuthSessionProvider {...props}>
      <SessionSync />
      {children}
    </NextAuthSessionProvider>
  )
}
