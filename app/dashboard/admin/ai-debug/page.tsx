import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AIDebugDashboard from "./components/AIDebugDashboard"
import { AppLoader } from "@/components/ui/loader"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "AI Debug Dashboard | Admin",
  description: "Test and debug AI provider functions",
}

/**
 * AI Debug Dashboard Page
 * Admin-only page for testing all AI functions
 */
export default async function AIDebugPage() {
  const session = await getServerSession(authOptions)

  // Double-check admin access (layout also checks)
  if (!session?.user?.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="text-center border-b-8 border-black pb-4">
        <h1 className="text-5xl font-black uppercase tracking-wider text-black mb-4">
          🤖 AI DEBUG DASHBOARD
        </h1>
        <p className="text-xl font-bold text-gray-600 uppercase tracking-wide">
          Test And Debug All AI Functions
        </p>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
        <Suspense fallback={<AppLoader message="Loading AI Debug Dashboard..." />}>
          <AIDebugDashboard />
        </Suspense>
      </div>
    </div>
  )
}
