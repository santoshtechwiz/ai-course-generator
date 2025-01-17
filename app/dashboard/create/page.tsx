import CreateCourseForm from "./components/CreateCourseForm"
import { getCourseDetails } from "@/lib/db"
import PopularCourses from "./components/PopularCourses"

export const fetchCache = "force-no-store"

const Page = async ({ searchParams }: { searchParams: Promise<{ topic?: string }> }) => {
  const topic = (await searchParams)?.topic || ""
  const courseData = await getCourseDetails()

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex-grow p-4 md:p-6">
        <div className="w-full max-w-4xl mx-auto">
          <CreateCourseForm topic={topic} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="md:w-[400px] border-l border-border bg-card">
        <PopularCourses courseDetails={courseData} />
      </div>
    </div>
  )
}

export default Page
