import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import CourseDetailsQuiz from "./CourseDetailsQuiz"

function QuizSection({ isLoading, quizData, currentChapter, course }: { isLoading: boolean, quizData: any, currentChapter: any, course: FullCourseType }) {
    if (isLoading) {
      return <QuizSkeleton />
    }
  
    if (!quizData || !currentChapter) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">No quiz available for this chapter.</p>
          </CardContent>
        </Card>
      )
    }
  
    return <CourseDetailsQuiz chapter={currentChapter} course={course} />
  }
  
  function QuizSkeleton() {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  export default QuizSection