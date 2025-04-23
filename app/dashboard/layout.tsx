import type React from "react"
import type { Metadata } from "next"

import { RootProvider } from "@/providers/root-provider"



export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard for managing courses and quizzes",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pt-16 transition-all duration-300">
     
        <RootProvider children={children} />

     
    </div>
  )
}
