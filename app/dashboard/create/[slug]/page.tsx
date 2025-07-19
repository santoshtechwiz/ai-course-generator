import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourses } from "@/app/actions/getCourses"
import type { Course, CourseUnit, Chapter } from "@prisma/client"

import CourseCreationVideo from "@/components/common/CourseCreationVideo"
import EnhancedConfirmChapters from "../components/EnhancedConfirmChapters"


type Props = {
  params: {
    slug: string
  }
}

export default async function CreateChapters({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params // Await the promise to extract slug
  const session = await getAuthSession()
  if (!session?.user) {
    return redirect("/dashboard")
  }  const course = await getCourses(slug)

  if (!course) {
    return redirect("/dashboard")
  }

  // Ensure TypeScript knows the structure
  const typedCourse = course as Course & {
    courseUnits: (CourseUnit & {
      chapters: Chapter[]
    })[]
  }

  // Transform course data to match expected structure
  const finalCourse = {
    ...typedCourse,
    units: typedCourse.courseUnits.map((unit) => ({
      ...unit,
      chapters: unit.chapters || []
    }))
  }


  return (
    <div className="flex flex-col min-h-screen bg-shadcn-primary-50">
      <div className="flex flex-col flex-grow p-4 md:flex-row md:space-x-4">        <div className="w-full md:w-2/3 bg-shadcn-white rounded-lg shadow-md p-4 mb-4 md:mb-0">
          <EnhancedConfirmChapters course={finalCourse} />
        </div>
        <div className="w-full md:w-1/3">
          <CourseCreationVideo />
        </div>
      </div>
    </div>
  )
}
