"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"

interface CourseErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CourseErrorBoundary({
  error,
  reset,
}: CourseErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    // Log error to your error reporting service
    console.error("Course page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <Alert variant="destructive" className="max-w-2xl mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Course</AlertTitle>
        <AlertDescription>
          {error.message || "There was a problem loading this course."}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button
          onClick={() => router.push("/dashboard/course")}
          variant="default"
        >
          Return to Courses
        </Button>
      </div>
    </div>
  )
}
