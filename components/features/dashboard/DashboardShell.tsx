"use client"

import type React from "react"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  // Remove the useSession hook as it's causing the error
  // const { data: session } = useSession()

  return (
    <ClientLayoutWrapper>
      <div className="flex min-h-screen flex-col container mx-auto">{children}</div>
    </ClientLayoutWrapper>
  )
}
