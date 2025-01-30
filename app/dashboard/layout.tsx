import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/app/components/shared/Navbar"
import Footer from "@/app/components/shared/Footer"
import { ClientLayoutWrapper } from "../components/ClientLayoutWrapper"
import { LoadingBar } from "../components/Loadingbar"
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-grow py-8">
            <Suspense fallback={<LoadingBar />}>{children}</Suspense>
          </div>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ClientLayoutWrapper>
  )
}

