import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AdminNav from "./components/admin-nav"

export const dynamic = 'force-dynamic'

/**
 * Admin Layout
 * 
 * Protected layout for admin-only pages with:
 * - Authentication check and admin role validation
 * - Consistent sidebar navigation
 * - Responsive grid layout
 * 
 * Note: DashboardLayout already provides padding, this just adds admin-specific structure
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
    <div className="w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-6">
          <aside className="hidden md:block">
            <AdminNav user={{ isAdmin: true }} />
          </aside>
          <main className="min-w-0 bg-yellow-50 p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
