import Link from "next/link"
import React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Logo from "./Logo"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-[1fr,auto]">
          {/* Logo and Navigation */}
          <div className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
             <Logo></Logo>
              <nav className="flex flex-wrap gap-4">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/dashboard/courses">Courses</Link>
                </Button>
                <Button variant="ghost" asChild size="sm">
                  <Link href="/privacy">Privacy</Link>
                </Button>
                <Button variant="ghost" asChild size="sm">
                  <Link href="/terms">Terms</Link>
                </Button>
              </nav>
            </div>

            {/* Disclaimer */}
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="leading-relaxed">
                Disclaimer: AI can make mistakes. Course AI is an AI-powered tool and may produce incorrect or biased
                information. Always verify important information.
              </p>
              <Separator className="my-4" />
              <p className="leading-relaxed">
                The information provided by Course AI is for general informational purposes only. All information is
                provided in good faith, however we make no representation or warranty of any kind, express or implied,
                regarding the accuracy, adequacy, validity, reliability, availability or completeness of any
                information.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex items-end">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Course AI. <br className="sm:hidden" />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

