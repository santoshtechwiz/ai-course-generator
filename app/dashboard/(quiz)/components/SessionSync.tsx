"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { syncSessionState, migrateUserSession } from "@/store/slices/authSlice"
import { migrateSessionData } from "@/store/slices/quizSlice"

/**
 * SessionSync component handles authentication state synchronization
 * and session migration for quiz data when users sign in/out
 * This is a new component that enhances existing functionality
 */
export function SessionSync() {
  const { data: session, status } = useSession()
  const dispatch = useDispatch<AppDispatch>()

  const authState = useSelector((state: RootState) => state.auth)
  const quizSessionId = useSelector((state: RootState) => state.quiz.sessionId)

  const lastSessionRef = useRef<string | null>(null)
  const migrationInProgressRef = useRef(false)

  // Sync authentication state with NextAuth session
  useEffect(() => {
    if (status === "loading") return

    const currentSessionId = session?.user?.id || null
    const wasAuthenticated = authState.isAuthenticated
    const isNowAuthenticated = !!session?.user

    // Only sync if session actually changed
    if (lastSessionRef.current !== currentSessionId) {
      dispatch(syncSessionState())
      lastSessionRef.current = currentSessionId
    }

    // Handle session migration when user signs in
    if (
      !wasAuthenticated &&
      isNowAuthenticated &&
      session?.user?.id &&
      quizSessionId &&
      !migrationInProgressRef.current
    ) {
      migrationInProgressRef.current = true

      const migrateSession = async () => {
        try {
          // Generate new user session ID
          const newSessionId = `user_${session.user.id}_${Date.now()}`

          // Migrate auth session
          await dispatch(migrateUserSession(session.user.id)).unwrap()

          // Migrate quiz session
          await dispatch(
            migrateSessionData({
              oldSessionId: quizSessionId,
              newSessionId,
            }),
          ).unwrap()

          console.log("Session migration completed successfully")
        } catch (error) {
          console.error("Session migration failed:", error)
        } finally {
          migrationInProgressRef.current = false
        }
      }

      migrateSession()
    }
  }, [session, status, authState.isAuthenticated, quizSessionId, dispatch])

  // Handle sign out - clear sensitive data
  useEffect(() => {
    if (status === "unauthenticated" && authState.isAuthenticated) {
      // User signed out, clear auth state
      dispatch({ type: "auth/signOut" })
    }
  }, [status, authState.isAuthenticated, dispatch])

  return null // This component doesn't render anything
}
