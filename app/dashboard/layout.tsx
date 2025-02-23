import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"


import { getAuthSession } from "@/lib/authOptions"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { Chatbot } from "@/components/Chatbot"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import Navbar from "@/components/shared/Navbar"

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
        <Chatbot userId={session?.user?.id || ""}  />
      </div>
    </ClientLayoutWrapper>
  )
}

