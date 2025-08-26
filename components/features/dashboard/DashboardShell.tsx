"use client"

import type React from "react"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"

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
