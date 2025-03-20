import { getAuthSession } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { AccountPageClient } from "./account-page-client"

export const metadata: Metadata = {
  title: "Account Settings | Course AI",
  description: "Manage your account settings, subscription, and preferences.",
}

export default async function AccountPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/account")
  }

  return <AccountPageClient user={session.user} />
}

