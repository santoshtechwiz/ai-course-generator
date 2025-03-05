import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6 p-8 max-w-md w-full bg-card rounded-lg shadow-lg">
        <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="text-4xl font-bold text-foreground">404 - Page Not Found</h1>
        <p className="text-lg text-muted-foreground">
          Oops! The course you're looking for seems to have gone on an adventure of its own.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/courses">
              View All Courses
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  )
}

