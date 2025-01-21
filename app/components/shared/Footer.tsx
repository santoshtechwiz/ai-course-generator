import Link from "next/link"
import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Logo from "./Logo"

export default function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap gap-2">
            <Button variant="link" asChild size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/dashboard/courses">Courses</Link>
            </Button>
            <Button variant="link" asChild size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/privacy">Privacy</Link>
            </Button>
            <Button variant="link" asChild size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/terms">Terms</Link>
            </Button>
          </nav>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Course AI
          </div>
        </div>

        <Separator className="my-4" />

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground">
          <p className="leading-relaxed">
            Disclaimer: AI can make mistakes. Course AI is an AI-powered tool and may produce incorrect or biased
            information. Always verify important information. The information provided is for general purposes only.
          </p>
        </div>
      </div>
    </footer>
  )
}
