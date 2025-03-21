import { Suspense } from "react"
import type { Metadata } from "next"
import { Users, Settings, CreditCard } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { authOptions } from "@/lib/authOptions"
import { LoadingSkeleton } from "./components/loading-skeleton"
import { UserForm } from "./components/user-form"
import { UserList } from "./components/user-list"
import { UserStats } from "./components/user-stats"


export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users, update information and credits",
}

export default async function AdminDashboardPage() {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions)

  if (!session || !session.user.isAdmin) {
    redirect("/unauthorized")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">View and manage user accounts, update information and credits.</p>
      </div>

      <Separator />

      <Suspense fallback={<LoadingSkeleton />}>
        <Tabs defaultValue="all-users" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all-users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">All Users</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Premium</span>
              </TabsTrigger>
            </TabsList>

            <UserStats />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <TabsContent value="all-users" className="mt-0 space-y-4">
              <UserList filter="all" />
            </TabsContent>
            <TabsContent value="admins" className="mt-0 space-y-4">
              <UserList filter="admin" />
            </TabsContent>
            <TabsContent value="premium" className="mt-0 space-y-4">
              <UserList filter="premium" />
            </TabsContent>

            <div className="bg-card rounded-lg border shadow-sm p-6">
              <UserForm />
            </div>
          </div>
        </Tabs>
      </Suspense>
    </div>
  )
}

