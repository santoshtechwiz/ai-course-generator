import { Suspense } from "react"
import type { Metadata } from "next"

import { Skeleton } from "@/components/ui/skeleton"
import ProfileHeader from "@/components/features/profile/ProfileHeader"
import ProfileCourses from "@/components/features/profile/ProfileCourses"
import ProfileQuizzes from "@/components/features/profile/ProfileQuizzes"
import ProfileStats from "@/components/features/profile/ProfileStats"
import ProfileSubscription from "@/components/features/profile/ProfileSubscription"

export const metadata: Metadata = {
  title: "Your Profile I",
  description:
    "Manage your Course AI profile, view your learning statistics, and track your progress across courses and quizzes.",
  keywords: [
    "user profile",
    "learning statistics",
    "course progress",
    "quiz history",
    "account management",
    "learning dashboard",
  ],
  openGraph: {
    title: "Your Profile I",
    description:
      "Manage your Course AI profile, view your learning statistics, and track your progress across courses and quizzes.",
    url: "https://courseai.io/dashboard/profile",
    type: "profile",
    images: [{ url: "/og-image-profile.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Profile I",
    description:
      "Manage your Course AI profile, view your learning statistics, and track your progress across courses and quizzes.",
    images: ["/twitter-image-profile.jpg"],
  },
}

export default function ProfilePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // ProfilePage schema
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Your Profile",
    description:
      "Manage your Course AI profile, view your learning statistics, and track your progress across courses and quizzes.",
    url: `${baseUrl}/dashboard/profile`,
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dashboard",
        item: `${baseUrl}/dashboard`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Profile",
        item: `${baseUrl}/dashboard/profile`,
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <ProfileHeader />
          </Suspense>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-[100px] w-full" />}>
              <ProfileStats />
            </Suspense>
          </div>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <ProfileCourses />
            </Suspense>
          </div>
          <div className="mt-8">
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <ProfileQuizzes />
            </Suspense>
          </div>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ProfileSubscription />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

