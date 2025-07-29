import { generateMetadata } from "@/lib/seo-manager"
import SubscriptionPageClient from "./components/SubscriptionPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "Subscription Plans ",
  description:
    "Explore our subscription plans and choose the perfect option to enhance your learning experience with Course AI.",
  path: "/dashboard/subscription",
  keywords: [
    "subscription plans",
    "pricing",
    "premium features",
    "learning subscription",
    "course access",
    "educational plans",
  ],
  ogImage: { url: "/og-image-subscription.jpg" },
})

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const referralCode = (await searchParams).ref ?? null

  return <SubscriptionPageClient refCode={referralCode} />
}

export default Page
