'use client'
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/app/components/shared/Navbar"
import Footer from "@/app/components/shared/Footer"
import { ClientLayoutWrapper } from "../components/ClientLayoutWrapper"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientLayoutWrapper>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto px-4 lg:px-4">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </div>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ClientLayoutWrapper>
  )
}

