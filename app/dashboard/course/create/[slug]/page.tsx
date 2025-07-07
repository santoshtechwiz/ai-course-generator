import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourses } from "@/app/actions/getCourses"

import CourseCreationVideo from "@/components/common/CourseCreationVideo"
import ConfirmChapters from "@/app/dashboard/course/create/components/ConfirmChapters"

type Props = {
  params: {
    slug: string
  }
}

export default async function CreateChapters({ params }: Props) {
  const { slug } = params // Directly access the slug from params
  console.log("Processing course with slug:", slug) // Debug log
  
  const session = await getAuthSession()
  if (!session?.user) {
    return redirect("/dashboard")
  }

  try {
    const course = await getCourses(slug)
    console.log("Course data retrieved:", !!course) // Debug log
    
    if (!course) {
      console.error(`Course not found for slug: ${slug}`)
      return redirect("/dashboard/course/create")
    }

    return (
      <div className="flex flex-col min-h-screen bg-shadcn-primary-50">
        <div className="flex flex-col flex-grow p-4 md:flex-row md:space-x-4">
          <div className="w-full md:w-2/3 bg-shadcn-white rounded-lg shadow-md p-4 mb-4 md:mb-0">
            <ConfirmChapters course={{ ...course, units: course.courseUnits }} />
          </div>
          <div className="w-full md:w-1/3">
            <CourseCreationVideo />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error(`Error loading course with slug ${slug}:`, error)
    return redirect("/dashboard/course/create")
  }
}