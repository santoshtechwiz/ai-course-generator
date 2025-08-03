"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'

interface QuizSEOProps {
  title?: string
  description?: string
  quizType?: string
  slug?: string
  quizData?: any
}

export default function QuizSEO({
  title,
  description,
  quizType = "quiz",
  slug,
  quizData,
}: QuizSEOProps) {
  const pathname = usePathname()
  
  // Get quiz data from Redux store if not provided
  const quizState = useSelector((state: any) => state.quiz);
  const quizFromStore = quizData || quizState;
  
  useEffect(() => {
    // Use actual quiz title from data or provided title - NO SLUG IN TITLE
    const actualTitle = quizFromStore?.title || title;
    const quizTypeLabel = getQuizTypeLabel(quizType)
    
    // Simple title: use actual title or fallback to quiz type only
    const finalTitle = actualTitle 
      ? `${actualTitle} | CourseAI` 
      : `${quizTypeLabel} | CourseAI`
    
    // Update document title
    document.title = finalTitle
    
    // Add SEO keywords to page
    let keywordsTag = document.querySelector('meta[name="keywords"]')
    if (!keywordsTag) {
      keywordsTag = document.createElement('meta')
      keywordsTag.setAttribute('name', 'keywords')
      document.head.appendChild(keywordsTag)
    }
    
    // Generate SEO keywords based on quiz type and title
    const keywords = [
      actualTitle || '',
      'online quiz',
      'practice test',
      'learning assessment',
      'educational quiz',
      quizType === 'mcq' ? 'multiple choice quiz' : '',
      quizType === 'code' ? 'coding challenge, programming practice' : '',
      quizType === 'blanks' ? 'fill in the blanks, learning exercise' : '',
      quizType === 'openended' ? 'open ended quiz, critical thinking' : '',
      'skill test',
      'knowledge check',
      'interactive learning'
    ].filter(Boolean).join(', ')
    
    keywordsTag.setAttribute('content', keywords)
    
    // Update meta description if provided
    if (description) {
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

// Helper function
function getQuizTypeLabel(quizType: string): string {
  switch (quizType) {
    case "mcq": return "Multiple Choice Quiz";
    case "code": return "Coding Challenge";
    case "blanks": return "Fill in the Blanks Quiz";
    case "openended": return "Open-Ended Quiz";
    case "flashcard": return "Flashcard Study";
    default: return "Interactive Quiz";
  }
}
