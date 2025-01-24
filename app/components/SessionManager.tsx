"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function SessionManager() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const checkSession = () => {
      if (status === "unauthenticated") {
        router.push("/auth/signin")
      }
    }

    // Check session on mount
    checkSession()

    // Check session when the window gains focus
    window.addEventListener("focus", checkSession)

    return () => {
      window.removeEventListener("focus", checkSession)
    }
  }, [status, router])

  return null
}

