import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Course } from "@/app/types"



interface MyCoursesProps {
  courses: Course[]
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/course/${course.slug}`}
                  className="group block"
                >
                  <div className="flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                      <Image
                        src={course.image || "/placeholder.svg"}
                        alt={course.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{course.name}</h3>
                        <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No courses created yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start creating your first course.</p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/dashboard/create">Create a Course</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
