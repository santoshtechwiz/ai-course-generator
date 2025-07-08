import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourses } from "@/app/actions/getCourses"

import CourseCreationVideo from "@/components/common/CourseCreationVideo"
import ConfirmChapters from "../components/ConfirmChapters"


type Props = {
  params: {
    slug: string
  }
}

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
//   const { slug } = await params
//   const course = await getCourseData(slug)

//   if (!course) {
//     return setSeo({
//       title: "Course Creation | CourseAI",
//       description: "Create your own interactive programming course with our AI-powered tools.",
//     })
//   }

//   return setSeo({
//     title: `Creating: ${course.title} | Course AI`,
//     description: `Design and build your ${course.title?.toLowerCase()} course with our intuitive course creation tools. Share your expertise and engage learners effectively.`,
//     path: `/dashboard/explore/${slug}`,
//     keywords: [
//       `${course.title?.toLowerCase()} course creation`,
//       "build online course",
//       "teaching platform",
//       "educational content",
//       "course design",
//       "AI course builder",
//     ],
//     ogType: "website",
//   })
// }

export default async function CreateChapters({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params // Await the promise to extract slug
  const session = await getAuthSession()

  if (!session?.user) {
    return redirect("/dashboard")
  }

  const course = await getCourses(slug)


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
}
