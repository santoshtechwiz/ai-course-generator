import type React from "react"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"

/**
 * Course Module Layout
 * 
 * Unified layout for all course-related pages with:
 * - Consistent spacing and styling
 * - Full-width responsive design
 * - SEO optimization for course discovery
 */

export const metadata: Metadata = generateSEOMetadata({
  title: "Online Courses – Learn at Your Own Pace | CourseAI",
  description: 
    "Explore our library of AI-generated courses designed to help you master new skills efficiently. Interactive lessons with multimedia content for effective learning.",
  keywords: [
    "online courses",
    "interactive learning",
    "skill development",
    "e-learning",
    "educational content",
    "courseai courses",
    "professional development",
    "certification courses",
    "learning platform"
  ],
  noIndex: true, // Dashboard content should not be indexed
})

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModuleLayout variant="default" suspense={true} className="course-module-layout">
      {children}
    </ModuleLayout>
  )
}
