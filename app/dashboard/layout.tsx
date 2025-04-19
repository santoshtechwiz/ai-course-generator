import type React from "react"
import type { Metadata } from "next"
import DashboardLayoutClient from "./DashboardLayoutClient"



export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard for managing courses and quizzes",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pt-16 transition-all duration-300">
      <DashboardLayoutClient children={children} />
    </div>
  )
}
