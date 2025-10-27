import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { UserManagement } from "./user-management"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "User Management",
  description: "Manage users, credits, and subscriptions",
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  console.log('[AdminUsersPage] Session check:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    isAdmin: session?.user?.isAdmin,
    userEmail: session?.user?.email
  })

  // If no session, redirect to login
  if (!session || !session.user) {
    console.log('[AdminUsersPage] No session found, redirecting to login')
    redirect("/api/auth/signin?callbackUrl=/dashboard/admin/users")
  }

  // If user is not an admin, redirect to the homepage
  if (session.user.isAdmin !== true) {
    console.log('[AdminUsersPage] User is not admin, redirecting to homepage')
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

      <div className="border rounded-none overflow-hidden">
        {/* Header skeleton */}
        <div className="grid grid-cols-4 gap-4 border-b p-4 bg-muted/30">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>

        {/* Rows skeleton */}
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
              <Skeleton className="h-8 w-[80px] my-auto" />
              <Skeleton className="h-6 w-[60px] my-auto" />
              <Skeleton className="h-6 w-[120px] my-auto" />
            </div>
          ))}

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between p-4 border-t">
          <Skeleton className="h-5 w-[100px]" />
          <div className="flex gap-1">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-none" />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
