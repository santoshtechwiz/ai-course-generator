import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

import EmailCampaignManager from "../components/email/email-campaign-manager"
import EmailTemplateSystem from "../components/email/email-template-system"
import { Skeleton } from "@/components/ui/skeleton"


export const metadata = {
  title: "Email Management",
  description: "Manage email templates and campaigns",
}

export default async function EmailPage() {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions)

  // If no session or user is not an admin, redirect to the homepage
  if (!session || !session.user || session.user.isAdmin !== true) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
        <p className="text-muted-foreground mt-2">Create and manage email campaigns</p>
      </div>

      <Separator />

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <EmailCampaignManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <EmailTemplateSystem />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
