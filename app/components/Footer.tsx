'use client'
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t", className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Course AI. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/courses">Courses</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/privacy">Privacy</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/terms">Terms</Link>
          </Button>
        </div>
      </div>
      <div className="container py-4 text-center text-sm text-muted-foreground">
        <p className="mt-2">
          Disclaimer: AI can make mistakes. Course AI is an AI-powered tool and may produce
          incorrect or biased information. Always verify important information.
        </p>
        <p className="mt-2">
          The information provided by Course AI is for general informational purposes only.
          All information is provided in good faith, however we make no representation or warranty
          of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability,
          availability or completeness of any information.
        </p>
      </div>
    </footer>
  )
}

