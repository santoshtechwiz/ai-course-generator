"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import { UserRole } from "@/app/types/auth-types"


// Auth hook interface
export interface AuthHookReturn {
  userId: string | null
  userEmail: string | null
  userImage: string | null
  userName: string | null
  userRole: UserRole
  isAuthenticated: boolean
  status: "authenticated" | "unauthenticated" | "loading"
  fromAuth: boolean
  redirectInfo: { path: string } | null
  signIn: (callbackUrl?: string) => void
  signOut: () => void
  requireAuth: (callbackUrl?: string) => boolean
  getAuthRedirectInfo: () => { path: string } | null
}

// Create implementation function
function useAuthImplementation(): AuthHookReturn {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)
  const searchParams = useSearchParams()
  const fromAuth = searchParams?.has("fromAuth") || false

  // Get redirect information from URL
  const getAuthRedirectInfo = useCallback(() => {
    const redirectPath = searchParams?.get("redirect")
    if (redirectPath) {
      return { path: redirectPath }
    }
    return null
  }, [searchParams])

  // Extracted auth data for easier access
  const userId = session?.user?.id || null
  const userEmail = session?.user?.email || null
  const userName = session?.user?.name || null
  const userImage = session?.user?.image || null
  const userRole = session?.user?.role || "user"
  const isAuthenticated = status === "authenticated" && !!session?.user

  // Typed helper for sign-in
  const handleSignIn = useCallback((callbackUrl?: string) => {
    signIn(undefined, { callbackUrl })
  }, [])

  // Typed helper for sign-out
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/" })
  }, [])

  // Auth check with redirection as needed
  const requireAuth = useCallback((callbackUrl?: string): boolean => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: callbackUrl || window.location.pathname })
      return false
    }
    return true
  }, [status])

  // Extract redirect info from search params
  const redirectInfo = getAuthRedirectInfo()

  // Return the auth interface
  return {
    userId,
    userEmail,
    userImage,
    userName,
    userRole,
    isAuthenticated,
    status,
    fromAuth,
    redirectInfo,
    signIn: handleSignIn,
    signOut: handleSignOut,
    requireAuth,
    getAuthRedirectInfo,
  }
}

// Export the hook - keep it simple
export const useAuth = useAuthImplementation;

// Export mock creator but don't try to modify module.exports
export function _createMockUseAuth(overrides?: Partial<AuthHookReturn>): AuthHookReturn {
  return {
    userId: "test-user-id",
    userEmail: "test@example.com",
    userImage: null,
    userName: "Test User",
    userRole: "user",
    isAuthenticated: true,
    status: "authenticated",
    fromAuth: false,
    redirectInfo: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    requireAuth: jest.fn().mockReturnValue(true),
    getAuthRedirectInfo: jest.fn().mockReturnValue(null),
    ...overrides,
  }
}
