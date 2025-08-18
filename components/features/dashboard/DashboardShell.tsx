"use client"

import type React from "react"

import MainNavbar from "@/components/layout/navigation/MainNavbar"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <ClientLayoutWrapper 
        withTheme={true}
        withSubscriptionSync={true}
      >
        <MainNavbar />
        {children}
      </ClientLayoutWrapper>
    </div>
  )
}
