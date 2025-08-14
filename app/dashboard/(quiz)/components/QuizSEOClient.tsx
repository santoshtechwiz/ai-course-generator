"use client"

import { DefaultSEO } from "@/lib/seo"
import { usePathname } from "next/navigation"

export default function QuizSEOClient() {
  const pathname = usePathname()
  return <DefaultSEO enableFAQ={false} enableBreadcrumbs={true} currentPath={pathname} />
}