"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Head from "next/head"

interface QuizSEOWrapperProps {
  children: React.ReactNode
  quizType?: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "document"
  title?: string
  description?: string
  topic?: string
  difficulty?: string
  questionCount?: number
}

/**
 * Centralized Quiz SEO Wrapper
 * 
 * This client-side wrapper uses Next.js Head component to properly update
 * document title and meta tags for quiz pages. Works with any quiz type
 * and can extract info from URL if not provided.
 */
export function QuizSEOWrapper({
  children,
  quizType,
  title,
  description,
  topic,
  difficulty,
  questionCount
}: QuizSEOWrapperProps) {
  const pathname = usePathname()

  // Extract quiz type from URL if not provided
  const detectedQuizType = quizType || extractQuizTypeFromPath(pathname)
  
  // Generate dynamic title
  const dynamicTitle = generateDynamicTitle({
    title,
    quizType: detectedQuizType,
    topic,
    difficulty,
    pathname
  })
  
  // Generate dynamic description
  const dynamicDescription = generateDynamicDescription({
    description,
    quizType: detectedQuizType,
    topic,
    questionCount,
    pathname
  })

  // Generate structured data
  const structuredData = generateStructuredData({
    quizType: detectedQuizType,
    title: dynamicTitle,
    description: dynamicDescription,
    topic,
    questionCount
  })

  return (
    <>
      <Head>
        <title>{dynamicTitle}</title>
        <meta name="description" content={dynamicDescription} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={dynamicTitle} />
        <meta property="og:description" content={dynamicDescription} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={dynamicTitle} />
        <meta name="twitter:description" content={dynamicDescription} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>
      {children}
    </>
  )
}

// Helper functions
function extractQuizTypeFromPath(pathname: string): string {
  const segments = pathname.split('/')
  const quizTypeIndex = segments.findIndex(segment => segment === '(quiz)') + 1
  return segments[quizTypeIndex] || 'quiz'
}

function generateDynamicTitle({
  title,
  quizType,
  topic,
  difficulty,
  pathname
}: {
  title?: string
  quizType?: string
  topic?: string
  difficulty?: string
  pathname: string
}) {
  if (title) {
    return `${title} | CourseAI`
  }

  const quizTypeLabels = {
    mcq: "Multiple Choice Quiz",
    code: "Code Challenge",
    blanks: "Fill in the Blanks",
    openended: "Open-Ended Questions",
    flashcard: "Flashcard Quiz",
    document: "Document Quiz"
  }

  const quizLabel = quizTypeLabels[quizType as keyof typeof quizTypeLabels] || "Interactive Quiz"
  
  // Extract topic from URL slug if not provided
  const urlTopic = topic || extractTopicFromPath(pathname)
  const difficultyText = difficulty ? ` (${difficulty})` : ''
  const topicText = urlTopic ? ` - ${urlTopic}` : ''
  
  return `${quizLabel}${topicText}${difficultyText} | CourseAI`
}

function generateDynamicDescription({
  description,
  quizType,
  topic,
  questionCount,
  pathname
}: {
  description?: string
  quizType?: string
  topic?: string
  questionCount?: number
  pathname: string
}) {
  if (description) {
    return description
  }

  const quizDescriptions = {
    mcq: "Test your knowledge with interactive multiple-choice questions",
    code: "Challenge yourself with programming exercises and coding problems",
    blanks: "Complete the missing words and phrases to test your understanding",
    openended: "Express your knowledge through detailed written responses",
    flashcard: "Study and memorize key concepts with interactive flashcards",
    document: "Analyze and answer questions based on document content"
  }

  const baseDescription = quizDescriptions[quizType as keyof typeof quizDescriptions] || "Interactive learning experience"
  const urlTopic = topic || extractTopicFromPath(pathname)
  const topicText = urlTopic ? ` on ${urlTopic}` : ''
  const questionText = questionCount ? `. ${questionCount} questions` : ''
  
  return `${baseDescription}${topicText}${questionText}. Enhance your learning with AI-powered assessments.`
}

function extractTopicFromPath(pathname: string): string {
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  return lastSegment ? lastSegment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''
}

function generateStructuredData({
  quizType,
  title,
  description,
  topic,
  questionCount
}: {
  quizType?: string
  title?: string
  description?: string
  topic?: string
  questionCount?: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": title,
    "description": description,
    "educationalLevel": "intermediate",
    "learningResourceType": "Quiz",
    "interactivityType": "active",
    ...(questionCount && { "numberOfQuestions": questionCount }),
    ...(topic && { "about": topic }),
    "provider": {
      "@type": "Organization",
      "name": "CourseAI"
    }
  }
}

export default QuizSEOWrapper
