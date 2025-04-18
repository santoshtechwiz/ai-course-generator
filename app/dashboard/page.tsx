export const metadata = {
  title: "Explore Courses | Course AI",
  description: "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
}

import CourseList from "@/components/features/home/CourseLists"
import { getAuthSession } from "@/lib/authOptions"
import { Suspense } from "react"
import { CoursesListSkeleton } from "@/components/ui/loading/loading-skeleton"

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
  : "http://localhost:3000/dashboard/explore"

export default async function CoursesPage() {
  const session = await getAuthSession()
  return (
    <div className="min-h-screen">
      <div className="py-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Explore Quizzes</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover interactive quizzes designed to enhance your learning experience and test your knowledge
        </p>
      </div>

      <Suspense fallback={<CoursesListSkeleton />}>
        <CourseList url={url} userId={session?.user?.id} />
      </Suspense>
    </div>
  )
}
