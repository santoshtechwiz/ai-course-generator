"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"



interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { data: session } = useSession()

  return (
    <ClientLayoutWrapper>

      <div className="flex min-h-screen flex-col container mx-auto">{children}</div>

    </ClientLayoutWrapper>
  )
}
