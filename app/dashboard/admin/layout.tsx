import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AdminNav from "./components/admin-nav"

/**
 * Admin Layout
 * 
 * Protected layout for admin-only pages with:
 * - Authentication check and admin role validation
 * - Consistent sidebar navigation
 * - Responsive grid layout
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 lg:gap-8">
        <aside className="hidden md:block">
          <AdminNav user={{ isAdmin: true }} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
