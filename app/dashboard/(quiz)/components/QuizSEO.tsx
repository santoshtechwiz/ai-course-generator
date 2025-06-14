"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface QuizSEOProps {
  title?: string
  description?: string
  quizType?: string
  slug?: string
}

export default function QuizSEO({
  title,
  description,
  quizType = "quiz",
  slug,
}: QuizSEOProps) {
  const pathname = usePathname()
  
  useEffect(() => {
    // Generate title if not provided
    const pageTitle = title || generateTitleFromSlug(slug || getSlugFromPath(pathname))
    const quizTypeLabel = getQuizTypeLabel(quizType)
    
    // Update document title
    document.title = `${pageTitle} ${quizTypeLabel} Quiz | CourseAI`
    
    // Update meta description if provided
    if (description) {
      // Find or create meta description tag
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', description)
    }
    
    return () => {
      // Cleanup is not strictly necessary as Next.js handles this,
      // but included for completeness
    }
  }, [title, description, quizType, slug, pathname])
  
  // This component doesn't render anything
  return null
}

// Helper functions
function getSlugFromPath(path: string): string {
  const segments = path.split('/')
  // The slug is typically the last segment in the URL
  return segments[segments.length - 1] || ''
}

function generateTitleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getQuizTypeLabel(quizType: string): string {
  switch (quizType) {
    case "mcq": return "Multiple Choice";
    case "code": return "Coding";
    case "blanks": return "Fill in the Blanks";
    default: return "";
  }
}
