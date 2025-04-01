import type React from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { BarChart, FileText, Send } from "lucide-react"
import { LoadingSkeleton } from "../components/loading-skeleton"


export default async function EmailLayout({
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
        <p className="text-muted-foreground mt-2">Create, manage, and analyze email campaigns for your users</p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="h-10 w-full justify-start">
          <TabsTrigger asChild value="campaigns">
            <Link href="/dashboard/admin/email/campaigns" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="templates">
            <Link href="/dashboard/admin/email/templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="analytics">
            <Link href="/dashboard/admin/email/analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </Link>
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
      </Tabs>
    </div>
  )
}

