import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button"
export default function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
        <Button variant="ghost" asChild>
            <Link href="/dashboard/courses">Courses</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/privacy">Privacy</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/terms">Terms</Link>
          </Button>
          .
        </p>
      </div>
      <div className="container py-4 text-center text-sm text-muted-foreground">
        <p className="mt-2">
          Disclaimer: AI can make mistakes. Course AI is an AI-powered tool and
          may produce incorrect or biased information. Always verify important
          information.
        </p>
        <p className="mt-2">
          The information provided by Course AI is for general informational
          purposes only. All information is provided in good faith, however we
          make no representation or warranty of any kind, express or implied,
          regarding the accuracy, adequacy, validity, reliability, availability
          or completeness of any information.
        </p>
      </div>
    </footer>
  );
}
