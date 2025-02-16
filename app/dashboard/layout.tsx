import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/app/components/shared/Navbar"
import Footer from "@/app/components/shared/Footer"
import { ClientLayoutWrapper } from "../components/ClientLayoutWrapper"

import type React from "react" // Added import for React

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientLayoutWrapper>
      <div className="flex min-h-screen flex-col">
        <Navbar />
      
        <main className="flex-grow flex flex-col">
          <div className=" flex-grow py-8">
            <Suspense >{children}</Suspense>
          </div>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ClientLayoutWrapper>
  )
}

