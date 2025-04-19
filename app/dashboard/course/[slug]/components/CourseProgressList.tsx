import Link from "next/link"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Clock, Book, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CourseProgress as CourseProgressType } from "@/app/types/types"

interface CourseProgressListProps {
  courses: CourseProgressType[]
}

export function CourseProgressList({ courses }: CourseProgressListProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {courses?.map((course, index) => (
          <Link
            key={`course-${course?.id || index}`}
            href={`/dashboard/course/${course?.course?.slug || "#"}`}
            className="group block"
          >
            <div className="flex items-center space-x-4 rounded-lg border border-border p-3 transition-all hover:bg-accent hover:shadow-md">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md sm:h-16 sm:w-16">
                <Image
                  src={course?.course?.image || "/placeholder.svg"}
                  alt={course?.course?.name || "Course Image"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium leading-none truncate sm:text-base">
                    {course?.course?.name || "Untitled Course"}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:h-5 sm:w-5" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{Math.round(course?.progress || 0)}% Complete</span>
                  </div>
                  <div className="flex items-center">
                    <Book className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{course?.course?.category?.name || "Uncategorized"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Last:{" "}
                    {course?.lastAccessedAt
                      ? new Date(course.lastAccessedAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>Time: {Math.round((course?.timeSpent || 0) / 3600)}h</span>
                </div>
                <Progress
                  value={course?.progress || 0}
                  className={cn(
                    "h-1 transition-all group-hover:h-2",
                    (course?.progress || 0) >= 100 ? "bg-success" : "bg-primary",
                  )}
                />
              </div>
            </div>
          </Link>
        )) || <p className="text-center text-muted-foreground">No courses available.</p>}
      </div>
    </ScrollArea>
  )
}

