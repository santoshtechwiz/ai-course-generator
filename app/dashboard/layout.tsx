import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/app/components/shared/Navbar"
import Footer from "@/app/components/shared/Footer"
import { ClientLayoutWrapper } from "../components/ClientLayoutWrapper"

import type React from "react" // Added import for React
import { Chatbot } from "../components/Chatbot"

import { getAuthSession } from "@/lib/authOptions"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session=await getAuthSession();

  return (
    <ClientLayoutWrapper>
      <div className="flex min-h-screen flex-col">
        <Navbar />
      
        <main className="flex-grow flex flex-col">
          <div className=" flex-grow py-8">
            <Suspense >{children}</Suspense>
          </div>
        </main>
        {/* <Footer /> */}
        <Toaster />
        <Chatbot userId={session?.user?.id||""}></Chatbot>
      </div>
    </ClientLayoutWrapper>
  )
}

