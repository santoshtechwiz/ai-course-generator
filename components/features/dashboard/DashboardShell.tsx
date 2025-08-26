"use client"

import type React from "react"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
// No loading provider needed - using next-nprogress-bar

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <ClientLayoutWrapper
      withTheme={true}
      withSubscriptionSync={true}
    >
      {children}
    </ClientLayoutWrapper>
  )
}
