"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useAppDispatch } from "@/store"

// This component syncs the session state with our Redux store
export function SessionSync() {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Update user state in Redux when session changes
      dispatch({
        type: "user/setUser",
        payload: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.credits,
        },
      })
    } else if (status === "unauthenticated") {
      // Clear user state when logged out
      dispatch({ type: "user/clearUser" })
    }
  }, [session, status, dispatch])

  return null
}
