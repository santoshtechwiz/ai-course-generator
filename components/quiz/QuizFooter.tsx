import { HelpCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuizFooter() {
  return (
    <footer className="bg-muted/40 border-t py-4">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CourseAI. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/help">
              <HelpCircle className="h-4 w-4 mr-1" />
              Help Center
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/feedback">
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  )
}
