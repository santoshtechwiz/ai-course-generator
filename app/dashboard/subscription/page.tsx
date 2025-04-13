
import { generatePageMetadata } from "@/lib/seo-utils"
import SubscriptionPageClient from "./components/SubscriptionPageClient"
import { Metadata } from "next";


export const metadata: Metadata = generatePageMetadata({
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
  ogImage: "/og-image-subscription.jpg",
})

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const referralCode = (await searchParams).ref ?? null;

  return <SubscriptionPageClient refCode={referralCode} />;
}

