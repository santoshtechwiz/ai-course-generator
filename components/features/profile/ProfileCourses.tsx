"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import  {Loader}  from "@/components/ui/loader"

interface Course {
  id: string
  title: string
  progress: number
}

export default function ProfileCourses() {
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery<Course[]>({
    queryKey: ["userCourses"],
    queryFn: async () => {
      const response = await axios.get("/api/user/courses")
      return response.data
    },
  })

  if (isLoading) return <div><Loader></Loader></div>
  if (error) return <div>Error loading courses</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Courses</CardTitle>
        <CardDescription>Track your learning progress</CardDescription>
      </CardHeader>
      <CardContent>
        {courses && courses.length > 0 ? (
          <ul className="space-y-4">
            {courses.map((course) => (
              <li key={course.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{course.title}</span>
                  <span className="text-sm text-muted-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven't started any courses yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

