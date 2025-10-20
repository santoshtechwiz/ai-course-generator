import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AIDebugDashboard from "./components/AIDebugDashboard"
import { Loader } from "@/components/loader"

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🤖 AI Debug Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Test and debug all AI functions with real-time results
        </p>
      </div>

      <Suspense fallback={<Loader message="Loading AI Debug Dashboard..." />}>
        <AIDebugDashboard />
      </Suspense>
    </div>
  )
}
