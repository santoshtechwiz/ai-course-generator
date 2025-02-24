import type { Metadata } from "next"
import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "./components/dashboard-header"
import { DashboardShell } from "./components/dashboard-shell"
import { UserSubscriptionTable } from "./components/user-subscription-table"
import { UserSubscriptionTableSkeleton } from "./components/user-subscription-table-skeleton"


export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage user subscriptions and tokens",
}

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  if (session && !session.user.isAdmin) {
    return <div className="flex h-screen items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You do not have permission to access this page.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  }

  return (
    <DashboardShell>
    
        <div className="flex-1 space-y-4 p-8 pt-6">
          <DashboardHeader heading="Admin Dashboard" text="Manage user subscriptions and tokens" />
         
        
          <Suspense fallback={<UserSubscriptionTableSkeleton />}>
            <UserSubscriptionTable />
          </Suspense>
        </div>
    
    </DashboardShell>
  )
}
