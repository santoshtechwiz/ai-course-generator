


import { QuizWrapper } from "@/components/QuizWrapper";
import PopularCourses from "./components/PopularCourses";
import { getCourseDetails } from "@/lib/db";

const Page = async ({ searchParams }: { searchParams: Promise<{ topic?: string }> }) => {
   const topic = (await searchParams)?.topic || ""
   const courseData = await getCourseDetails()

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6 text-primary">Generate AI Course</h1>
          {/* <TopicForm credits={credits} /> */}
          <QuizWrapper type={"course"} />
        </div>
        <div className="hidden lg:block">
          {/* <RandomQuestions questions={randomQuestions} /> */}
          <PopularCourses courseDetails={courseData} />
        </div>
      </div>
    </div>
  )
}
export default Page