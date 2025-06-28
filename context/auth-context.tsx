"use client"

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
} from "react"
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react"
import { STORAGE_KEYS } from "@/constants/global"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import { useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { loginSuccess, logout as reduxLogout, loginStart, loginFailure, AuthUser } from "@/store/slices/auth-slice"



export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  status: "authenticated" | "loading" | "unauthenticated"
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  userId: string | undefined
  session: any
  logout: (options?: { redirect?: boolean; callbackUrl?: string }) => Promise<void>
  login: (provider: string, options?: { callbackUrl?: string }) => Promise<void>
  guestId: string | null
  getGuestId: () => string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({
  children,
  session,
}: {
  children: ReactNode
  session?: Session
}) {
  return (
    <SessionProvider session={session}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const dispatch = useAppDispatch()


  // Hydrate Redux auth state from next-auth session
  useEffect(() => {
    if (status === "loading") {
      dispatch(loginStart())
    } else if (status === "authenticated" && session?.user) {
      dispatch(loginSuccess({ user: session.user, token: session.user.accessToken || null }))
    } else if (status === "unauthenticated") {
      dispatch(reduxLogout())
    }
  }, [status, session, dispatch])

  const user = session?.user || null
  const token = session?.user?.accessToken || null
  const isAdmin = user?.isAdmin || false
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const userId = user?.id

  const getGuestId = useCallback((): string | null => {
    if (typeof window === "undefined") return null

    let guestId = sessionStorage.getItem("guestId")
    if (!guestId) {
      guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
      sessionStorage.setItem("guestId", guestId)
    } return guestId
  }, [])

  const login = useCallback(
    async (provider: string, options?: { callbackUrl?: string }) => {
      try {

        await signIn(provider, {
          callbackUrl: options?.callbackUrl || "/dashboard",
        })
      } catch (error) {
        console.error("Login failed:", error)
      } finally {

      }
    },
    []
  )
  const logout = useCallback(
    async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
      try {
        const redirectUrl = options.callbackUrl || "/auth/signout"

        // Use NextAuth's fast signOut with redirect
        await signOut({ redirect: true, callbackUrl: redirectUrl });
      } catch (error) {
        console.error("Logout failed:", error)
        if (options.redirect !== false && typeof window !== "undefined") {
          router.push("/");
        }
      } finally {

      }
    },
    [router]
  )

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      status,
      isAuthenticated,
      isLoading,
      isAdmin,
      userId,
      session,
      logout,
      login,
      guestId: getGuestId(),
      getGuestId,
    }),
    [user, token, status, isAuthenticated, isLoading, isAdmin, userId, session, logout, login, getGuestId]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return context
}
