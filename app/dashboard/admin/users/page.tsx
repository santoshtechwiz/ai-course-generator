import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { UserManagement } from "./user-management"
import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "User Management",
  description: "Manage users, credits, and subscriptions",
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  // If no session or user is not an admin, redirect to the homepage
  if (!session || !session.user || session.user.isAdmin !== true) {
    redirect("/")
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage users, credits, and subscriptions</p>
      </div>

      <Suspense fallback={<UserListSkeleton />}>
        <UserManagement />
      </Suspense>
    </div>
  )
}

function UserListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full" />
          ))}
      </div>
    </div>
  )
}

