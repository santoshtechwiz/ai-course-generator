import { getAuthSession } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { getCourses } from "@/app/actions/getCourses"
import ConfirmChapters from "@/components/features/course/ConfirmChapters"
import CourseCreationVideo from "@/components/landing/CourseCreationVideo"
import { getCourseData } from "@/app/actions/getCourseData"
import { generatePageMetadata } from "@/lib/seo-utils"
import type { Metadata } from "next"

export const fetchCache = "force-no-store"
type Props = {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourseData(params.slug)

  if (!course) {
    return {
      title: "Course Creation | CourseAI",
      description: "Create your own interactive programming course with our AI-powered tools.",
    }
  }

  return generatePageMetadata({
    title: `Creating: ${course.name} | Course AI`,
    description: `Design and build your ${course.name.toLowerCase()} course with our intuitive course creation tools. Share your expertise and engage learners effectively.`,
    path: `/dashboard/create/${params.slug}`,
    keywords: [
      `${course.name.toLowerCase()} course creation`,
      "build online course",
      "teaching platform",
      "educational content",
      "course design",
      "AI course builder",
    ],
    ogType: "website",
  })
}

export default async function CreateChapters({ params }: Props) {
  const slug = params.slug
  const session = await getAuthSession()

  if (!session?.user) {
    return redirect("/gallery")
  }

  const course = await getCourses(slug)

  if (!course) {
    return redirect("/create")
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
}

