
import { generateMetadata } from "@/lib/seo"
import SubscriptionPageClient from "./components/SubscriptionPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata({
  title: "Subscription Plans ",
  description:
    "Explore our subscription plans and choose the perfect option to enhance your learning experience with Course AI.",
  // path: "/dashboard/subscription",
  keywords: [
    "subscription plans",
    "pricing",
    "premium features",
    "learning subscription",
    "course access",
    "educational plans",
  ],

})

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const referralCode = (await searchParams).ref ?? null

  return ((
    <div className="min-h-screen flex flex-col items-center justify-center px-2 py-8">
      <div className="w-full  space-y-8">
        <SubscriptionPageClient refCode={referralCode} />
      </div>
    </div>
  ))

}

export default Page
