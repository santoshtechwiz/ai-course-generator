"use client"

import type React from "react"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import { LoadingProvider } from "@/components/loaders"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <LoadingProvider>
      <ClientLayoutWrapper
        withTheme={true}
        withSubscriptionSync={true}
      >
        {children}
      </ClientLayoutWrapper>
    </LoadingProvider>
  )
}
