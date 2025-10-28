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
      <div className="text-center border-b-8 border-black pb-4">
        <h1 className="text-5xl font-black uppercase tracking-wider text-black mb-4">
          EMAIL MANAGEMENT
        </h1>
        <p className="text-xl font-bold text-gray-600 uppercase tracking-wide">
          Blast Those Emails Like A Pro
        </p>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="bg-gray-100 p-2 h-auto">
            <TabsTrigger 
              value="campaigns" 
              className="px-8 py-4 text-lg font-black uppercase data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2"
            >
              CAMPAIGNS
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="px-8 py-4 text-lg font-black uppercase data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-2"
            >
              TEMPLATES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <Suspense fallback={<Skeleton className="h-32 w-full bg-gray-200" />}>
              <EmailCampaignManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <Suspense fallback={<Skeleton className="h-32 w-full bg-gray-200" />}>
              <EmailTemplateSystem />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
