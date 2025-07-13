import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AdminNav from "./components/admin-nav"
import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"

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
    <PageWrapper>
      <PageHeader>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <aside className="hidden md:block">
            <AdminNav user={{ isAdmin: true }} />
          </aside>

          <main>{children}</main>
        </div>
      </PageHeader>
    </PageWrapper>
  )
}
