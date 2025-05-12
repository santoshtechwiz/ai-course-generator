"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef } from "react"
import { useAppDispatch } from "@/store"

// This component syncs the session state with our Redux store
export function SessionSync() {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const prevSessionRef = useRef(session)

  useEffect(() => {
    // Only update Redux if the session actually changed
    if (
      status === "authenticated" &&
      session?.user &&
      (!prevSessionRef.current ||
        prevSessionRef.current.user.id !== session.user.id ||
        prevSessionRef.current.user.credits !== session.user.credits)
    ) {
      // Update user state in Redux when session changes
      dispatch({
        type: "user/setUser",
        payload: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.credits,
          isAdmin: session.user.isAdmin,
          userType: session.user.userType,
          subscriptionPlan: session.user.subscriptionPlan,
          subscriptionStatus: session.user.subscriptionStatus,
        },
      })

      // Update reference
      prevSessionRef.current = session
    } else if (status === "unauthenticated" && prevSessionRef.current) {
      // Clear user state when logged out
      dispatch({ type: "user/clearUser" })
      prevSessionRef.current = null
    }
  }, [session, status, dispatch])

  return null
}
