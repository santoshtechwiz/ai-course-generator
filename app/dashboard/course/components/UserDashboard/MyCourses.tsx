import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'


interface CourseType {

  userId: string;

  id: number;

  isPublic: boolean;

  slug: string | null;

  name: string;

  isCompleted: boolean | null;

  image: string;

  description: string | null;

  viewCount: number;

  totalRatings: number;

  averageRating: number;

  categoryId: number | null;

  createdAt: Date;

  updatedAt: Date;

}


interface MyCoursesProps {
  courses: CourseType[]
}

export function MyCourses({ courses }: MyCoursesProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center space-x-4">
                <img
                  src={course.image}
                  alt={course.name}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{course.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                </div>
                <Link href={`/dashboard/course/${course.slug}`} passHref>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No courses created yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start creating your first course.</p>
            <div className="mt-6">
              <Link href="/dashboard/create-course" passHref>
                <Button>Create a Course</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
