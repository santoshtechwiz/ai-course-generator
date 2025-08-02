import Link from "next/link"
import { FileQuestion, Search, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Metadata } from "next"

import { generateCourseNotFoundStructuredData } from "@/app/utils/not-found-utils"
import { JsonLD, generateMetadata } from "@/lib/seo";

// Enhanced metadata for course not found page
export const metadata: Metadata = generateMetadata({
  title: 'Course Not Found - Discover Alternative AI Courses',
  description: 'The course you were looking for could not be found. Explore our comprehensive collection of AI-powered educational courses and interactive learning materials.',
  keywords: [
    'course not found',
    'ai courses',
    'online learning',
    'educational content',
    'interactive courses',
    'alternative courses',
    'courseai',
    'learning platform'
  ],
  noIndex: true,
  noFollow: true,
  type: 'website',
  canonical: '/dashboard/course/not-found'
});

// Next.js will use this to set the correct HTTP status code
export default function CourseNotFound() {
  // Use the enhanced course-specific structured data
  const courseNotFoundStructuredData = generateCourseNotFoundStructuredData()

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Add structured data for SEO */}
      <JsonLD type="WebPage" data={courseNotFoundStructuredData} />

      <div className="text-center space-y-6 p-8 max-w-md w-full bg-card rounded-lg shadow-lg">
        <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="text-4xl font-bold text-foreground">404 - Course Not Found</h1>
        <p className="text-lg text-muted-foreground">
          We couldn't locate the course you're looking for. It may have been moved, renamed, or is no longer available.
        </p>

        <div className="py-2 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">What can you do now?</h2>
          <ul className="text-left pl-6 list-disc text-muted-foreground space-y-1">
            <li>Double-check the URL for any typos</li>
            <li>Browse our available courses</li>
            <li>Create your own course with AI</li>
            <li>Return to your dashboard</li>
          </ul>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/explore">
              <Search className="mr-2 h-4 w-4" />
              Explore Courses
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Need help? <a href="/contactus" className="text-primary hover:underline">Contact our support team</a> for assistance.
        </p>
      </div>
    </div>
  )
}
