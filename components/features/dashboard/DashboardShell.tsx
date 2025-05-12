"use client"

import type React from "react"
import { useEffect } from "react"

import { useAppDispatch } from "@/store"
import { fetchUserProfile } from "@/store/slices/userSlice"
import { useSession } from "next-auth/react"
import MainNavbar from "@/components/layout/navigation/MainNavbar"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession()
  const dispatch = useAppDispatch()

  // Fetch user profile if logged in
  useEffect(() => {
    if (session?.user?.id) {
      dispatch(fetchUserProfile(session.user.id))
    }
  }, [dispatch, session?.user?.id])

  return (
    <div className="flex min-h-screen flex-col">
      <ClientLayoutWrapper>
        <MainNavbar />
        {children}
      </ClientLayoutWrapper>
    </div>
  )
}
