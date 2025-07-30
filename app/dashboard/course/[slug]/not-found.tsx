import Link from "next/link"
import { FileQuestion, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Metadata } from "next"
import { notFoundMetadata } from "@/app/metadata/not-found-metadata"
import { notFoundStructuredData } from "@/app/utils/not-found-utils"
import { JsonLD } from "@/lib/seo-manager";

// Use the app's standard not-found metadata
export const metadata: Metadata = {
  ...notFoundMetadata,
  title: "Course Not Found | CourseAI",
  description: "We couldn't find the course you're looking for. Explore our other courses instead.",
}

// Next.js will use this to set the correct HTTP status code
export default function CourseNotFound() {
  // Customized structured data for course not found
  const courseNotFoundStructuredData = {
    ...notFoundStructuredData,
    name: "Course Not Found",
    description: "The requested course could not be found.",
    breadcrumb: {
      ...notFoundStructuredData.breadcrumb,
      itemListElement: [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://courseai.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Dashboard",
          "item": "https://courseai.com/dashboard",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Course Not Found",
          "item": "https://courseai.com/dashboard/course",
        },
      ],
    },
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Add structured data for SEO */}
      <JsonLD type="WebPage" data={courseNotFoundStructuredData} />

      <div className="text-center space-y-6 p-8 max-w-md w-full bg-card rounded-lg shadow-lg">
        <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="text-4xl font-bold text-foreground">404 - Course Not Found</h1>
        <p className="text-lg text-muted-foreground">
          Oops! The course you're looking for seems to have gone on an adventure of its own.
        </p>

        <div className="py-2 space-y-2">
          <h2 className="text-lg font-semibold">What can you do now?</h2>
          <ul className="text-left pl-6 list-disc text-muted-foreground">
            <li>Check the URL for typos</li>
            <li>Search for available courses</li>
            <li>Return to dashboard</li>
            <li>Browse our course categories</li>
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
        </div>
        <p className="text-sm text-muted-foreground">If you believe this is an error, please contact support.</p>
      </div>
    </div>
  )
}
