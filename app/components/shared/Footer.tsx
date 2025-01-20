import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="py-10 md:px-8 md:py-0 border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-4">
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
