"use client"

import type React from "react"

import MainNavbar from "@/components/layout/navigation/MainNavbar"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {


  return (
    <div className="flex bg-black-500 min-h-screen flex-col">
      <ClientLayoutWrapper>
        <MainNavbar />
        {children}
      </ClientLayoutWrapper>
    </div>
  )
}
