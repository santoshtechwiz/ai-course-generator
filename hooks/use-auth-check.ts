"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface UseAuthCheckOptions {
  redirectIfAuthenticated?: boolean
  redirectUrl?: string
  onAuthenticated?: () => void
  onUnauthenticated?: () => void
}

export function useAuthCheck({
  redirectIfAuthenticated = false,
  redirectUrl = "/dashboard",
  onAuthenticated,
  onUnauthenticated,
}: UseAuthCheckOptions = {}) {
  const { data: session, status } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Only run the check once the session status is determined
    if (status !== "loading") {
      setIsCheckingAuth(false)

      if (status === "authenticated") {
        onAuthenticated?.()
      } else {
        onUnauthenticated?.()
      }
    }
  }, [status, onAuthenticated, onUnauthenticated])

  const checkAuth = () => {
    if (status === "authenticated") {
      onAuthenticated?.()
      return true
    } else {
      setShowAuthModal(true)
      onUnauthenticated?.()
      return false
    }
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading" || isCheckingAuth,
    user: session?.user,
    checkAuth,
    showAuthModal,
    closeAuthModal,
  }
}
