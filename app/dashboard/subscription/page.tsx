import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import SubscriptionPageClient from "./components/SubscriptionPageClient"


export const metadata: Metadata = generatePageMetadata({
  title: "Subscription Plans | Course AI",
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
  ogImage: "/og-image-subscription.jpg",
})

export default async function Page() {
  return <SubscriptionPageClient />
}

